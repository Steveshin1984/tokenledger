import type { DatabaseSync } from "node:sqlite";
import { collectClaudeCodeToolActivity } from "./collectors/claude-code.js";
import { replaceWasteSignals, type WasteSignal } from "./db.js";

const NO_OUTPUT_COST_PERCENTILE = 0.9; // 상위 10%
const RETRY_CHAIN_THRESHOLD = 2; // 이 이상 반복돼야 "낭비"로 표시

interface SessionCostRow {
  session_id: string;
  project_path: string;
  total_cost: number;
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return Infinity;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(sortedAsc.length * p));
  return sortedAsc[idx];
}

// Claude Code 세션들을 대상으로 "무산출 고비용"과 "실패 재시도 체인" 두 신호를 계산해서 저장.
// tokenledger init 마지막에 호출됨. 반환값은 걸린 세션 수.
export function detectClaudeCodeWaste(db: DatabaseSync): number {
  const rows = db
    .prepare(
      `select session_id, project_path, sum(cost_usd) as total_cost
       from usage_events
       where tool = 'claude-code'
       group by session_id`
    )
    .all() as unknown as SessionCostRow[];

  const costs = rows.map((r) => r.total_cost).sort((a, b) => a - b);
  const costCutoff = percentile(costs, NO_OUTPUT_COST_PERCENTILE);

  const toolActivity = collectClaudeCodeToolActivity();

  const signals: WasteSignal[] = rows.map((row) => {
    const activity = toolActivity.get(row.session_id) ?? { editToolCalls: 0, errorRetryChains: 0 };
    const flags: string[] = [];

    if (activity.editToolCalls === 0 && row.total_cost > 0 && row.total_cost >= costCutoff) {
      flags.push("no_output_high_cost");
    }
    if (activity.errorRetryChains >= RETRY_CHAIN_THRESHOLD) {
      flags.push("failed_retry_chain");
    }

    return {
      session_id: row.session_id,
      tool: "claude-code",
      project_path: row.project_path,
      total_cost: row.total_cost,
      edit_tool_calls: activity.editToolCalls,
      error_retry_chains: activity.errorRetryChains,
      flags,
    };
  });

  replaceWasteSignals(db, "claude-code", signals);
  return signals.filter((s) => s.flags.length > 0).length;
}
