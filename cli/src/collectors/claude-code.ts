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
