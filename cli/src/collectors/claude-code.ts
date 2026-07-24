import { readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { costUsd } from "../pricing.js";
import type { UsageEvent } from "../db.js";

function findJsonlFiles(root: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(root, { recursive: true }) as string[];
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.endsWith(".jsonl"))
    .map((e) => join(root, e));
}

// Claude Code 로그(JSONL) 한 줄 -> UsageEvent. type이 "assistant"가 아니거나
// 필요한 필드가 없으면 null.
function parseLine(line: string): UsageEvent | null {
  if (!line.trim()) return null;

  let entry: any;
  try {
    entry = JSON.parse(line);
  } catch {
    return null;
  }

  if (entry.type !== "assistant") return null;

  const usage = entry.message?.usage;
  const model = entry.message?.model;
  const requestId = entry.requestId;
  const sessionId = entry.sessionId;
  const projectPath = entry.cwd;
  const timestamp = entry.timestamp;

  if (!usage || !model || !requestId || !sessionId || !projectPath || !timestamp) {
    return null;
  }

  const input_tokens = usage.input_tokens ?? 0;
  const output_tokens = usage.output_tokens ?? 0;
  const cache_1h_tokens = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const cache_5m_tokens = usage.cache_creation?.ephemeral_5m_input_tokens ?? 0;
  const cache_read_tokens = usage.cache_read_input_tokens ?? 0;

  return {
    request_id: requestId,
    tool: "claude-code",
    model,
    session_id: sessionId,
    project_path: projectPath,
    timestamp,
    input_tokens,
    output_tokens,
    cache_1h_tokens,
    cache_5m_tokens,
    cache_read_tokens,
    cost_usd: costUsd(model, {
      input_tokens,
      output_tokens,
      cache_1h_tokens,
      cache_5m_tokens,
      cache_read_tokens,
    }),
  };
}

// ~/.claude/projects/ 아래 모든 JSONL 로그 파일을 찾아서 UsageEvent 배열로 변환.
export function collectClaudeCodeEvents(): UsageEvent[] {
  const root = join(homedir(), ".claude", "projects");
  const files = findJsonlFiles(root);

  const events: UsageEvent[] = [];
  for (const file of files) {
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of content.split("\n")) {
      const event = parseLine(line);
      if (event) events.push(event);
    }
  }
  return events;
}

export interface SessionToolActivity {
  editToolCalls: number;
  errorRetryChains: number;
}

const EDIT_TOOL_NAMES = new Set(["Edit", "Write", "NotebookEdit"]);

interface ToolCallRecord {
  id: string;
  name: string;
  timestamp: string;
  isError: boolean;
}

// 세션별로 "파일 수정 도구를 몇 번 썼는지"와 "에러 직후 같은 도구를 다시 부른 횟수"를 센다.
// F4 낭비 감지(무산출 고비용 / 실패 재시도 체인)에 쓰인다.
export function collectClaudeCodeToolActivity(): Map<string, SessionToolActivity> {
  const root = join(homedir(), ".claude", "projects");
  const files = findJsonlFiles(root);

  const callsBySession = new Map<string, ToolCallRecord[]>();
  const errorById = new Map<string, boolean>();

  for (const file of files) {
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }

    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      let entry: any;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      const sessionId = entry.sessionId;
      if (!sessionId) continue;

      if (entry.type === "assistant") {
        const content = entry.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "tool_use" && block.id && block.name) {
              const arr = callsBySession.get(sessionId) ?? [];
              arr.push({ id: block.id, name: block.name, timestamp: entry.timestamp ?? "", isError: false });
              callsBySession.set(sessionId, arr);
            }
          }
        }
      } else if (entry.type === "user") {
        const content = entry.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "tool_result" && block.tool_use_id) {
              errorById.set(block.tool_use_id, block.is_error === true);
            }
          }
        }
      }
    }
  }

  const result = new Map<string, SessionToolActivity>();

  for (const [sessionId, calls] of callsBySession) {
    for (const call of calls) call.isError = errorById.get(call.id) ?? false;
    calls.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    let editToolCalls = 0;
    let errorRetryChains = 0;
    for (let i = 0; i < calls.length; i++) {
      if (EDIT_TOOL_NAMES.has(calls[i].name)) editToolCalls++;
      if (calls[i].isError && calls[i + 1]?.name === calls[i].name) {
        errorRetryChains++;
      }
    }
    result.set(sessionId, { editToolCalls, errorRetryChains });
  }

  return result;
}
