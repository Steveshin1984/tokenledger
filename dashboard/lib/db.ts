import { DatabaseSync } from "node:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";

export interface UsageEventRow {
  request_id: string;
  tool: string;
  model: string;
  session_id: string;
  project_path: string;
  timestamp: string;
  input_tokens: number;
  output_tokens: number;
  cache_1h_tokens: number;
  cache_5m_tokens: number;
  cache_read_tokens: number;
  cost_usd: number;
}

export interface DailyCost {
  date: string;
  cost: number;
}

export interface ToolCost {
  tool: string;
  cost: number;
}

export interface ProjectSummary {
  project_path: string;
  session_count: number;
  event_count: number;
  cost: number;
  last_activity: string;
}

export interface SessionSummary {
  session_id: string;
  project_path: string;
  model: string;
  event_count: number;
  cost: number;
  started_at: string;
  ended_at: string;
}

export interface WasteSignalRow {
  session_id: string;
  tool: string;
  project_path: string;
  total_cost: number;
  edit_tool_calls: number;
  error_retry_chains: number;
  flags: string; // JSON 배열 문자열
}

export const WASTE_FLAG_LABELS: Record<string, string> = {
  no_output_high_cost: "무산출 고비용",
  failed_retry_chain: "실패 재시도 체인",
};

// 읽기 전용으로 연다 — 대시보드는 CLI가 만든 DB를 보여주기만 함.
function openReadonlyDb(): DatabaseSync {
  const path = join(homedir(), ".tokenledger", "data.db");
  return new DatabaseSync(path, { readOnly: true });
}

// node:sqlite가 반환하는 행은 prototype이 없는 객체라서 Server -> Client
// Component 경계를 못 넘는다. 일반 객체로 바꿔준다.
function toPlainRows<T>(rows: unknown[]): T[] {
  return rows.map((r) => ({ ...(r as object) })) as T[];
}

export function getMonthlyTotal(): number {
  const db = openReadonlyDb();
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const row = db
      .prepare("select coalesce(sum(cost_usd), 0) as cost from usage_events where timestamp >= ?")
      .get(monthStart.toISOString()) as { cost: number };
    return row.cost;
  } finally {
    db.close();
  }
}

export function getDailyTrend(days = 30): DailyCost[] {
  const db = openReadonlyDb();
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = db
      .prepare(
        `select substr(timestamp, 1, 10) as date, sum(cost_usd) as cost
         from usage_events
         where timestamp >= ?
         group by date
         order by date asc`
      )
      .all(since.toISOString());
    return toPlainRows<DailyCost>(rows);
  } finally {
    db.close();
  }
}

export function getCostByTool(): ToolCost[] {
  const db = openReadonlyDb();
  try {
    const rows = db
      .prepare("select tool, sum(cost_usd) as cost from usage_events group by tool order by cost desc")
      .all();
    return toPlainRows<ToolCost>(rows);
  } finally {
    db.close();
  }
}

export function getProjectSummaries(): ProjectSummary[] {
  const db = openReadonlyDb();
  try {
    const rows = db
      .prepare(
        `select
           project_path,
           count(distinct session_id) as session_count,
           count(*) as event_count,
           sum(cost_usd) as cost,
           max(timestamp) as last_activity
         from usage_events
         group by project_path
         order by cost desc`
      )
      .all();
    return toPlainRows<ProjectSummary>(rows);
  } finally {
    db.close();
  }
}

export function getSessionsForProject(projectPath: string): SessionSummary[] {
  const db = openReadonlyDb();
  try {
    const rows = db
      .prepare(
        `select
           session_id,
           project_path,
           model,
           count(*) as event_count,
           sum(cost_usd) as cost,
           min(timestamp) as started_at,
           max(timestamp) as ended_at
         from usage_events
         where project_path = ?
         group by session_id
         order by ended_at desc`
      )
      .all(projectPath);
    return toPlainRows<SessionSummary>(rows);
  } finally {
    db.close();
  }
}

export function getSessionEvents(sessionId: string): UsageEventRow[] {
  const db = openReadonlyDb();
  try {
    const rows = db
      .prepare("select * from usage_events where session_id = ? order by timestamp asc")
      .all(sessionId);
    return toPlainRows<UsageEventRow>(rows);
  } finally {
    db.close();
  }
}

export function getWasteSignals(): WasteSignalRow[] {
  const db = openReadonlyDb();
  try {
    const rows = db.prepare("select * from waste_signals order by total_cost desc").all();
    return toPlainRows<WasteSignalRow>(rows);
  } finally {
    db.close();
  }
}

export function getWasteSignalForSession(sessionId: string): WasteSignalRow | null {
  const db = openReadonlyDb();
  try {
    const row = db.prepare("select * from waste_signals where session_id = ?").get(sessionId);
    return row ? { ...(row as object) } as WasteSignalRow : null;
  } finally {
    db.close();
  }
}
