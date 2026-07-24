import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface UsageEvent {
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

export function dbPath(): string {
  return join(homedir(), ".tokenledger", "data.db");
}

export function openDb(): DatabaseSync {
  mkdirSync(join(homedir(), ".tokenledger"), { recursive: true });
  const db = new DatabaseSync(dbPath());
  db.exec(`
    create table if not exists usage_events (
      request_id text primary key,
      tool text not null,
      model text not null,
      session_id text not null,
      project_path text not null,
      timestamp text not null,
      input_tokens integer not null default 0,
      output_tokens integer not null default 0,
      cache_1h_tokens integer not null default 0,
      cache_5m_tokens integer not null default 0,
      cache_read_tokens integer not null default 0,
      cost_usd real not null default 0
    );
    create index if not exists idx_usage_events_timestamp on usage_events(timestamp);
    create index if not exists idx_usage_events_session on usage_events(session_id);
  `);
  return db;
}

// 중복이면 무시하고 false, 새로 들어갔으면 true 반환
export function insertUsageEvent(db: DatabaseSync, e: UsageEvent): boolean {
  const stmt = db.prepare(`
    insert or ignore into usage_events
      (request_id, tool, model, session_id, project_path, timestamp,
       input_tokens, output_tokens, cache_1h_tokens, cache_5m_tokens, cache_read_tokens, cost_usd)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    e.request_id,
    e.tool,
    e.model,
    e.session_id,
    e.project_path,
    e.timestamp,
    e.input_tokens,
    e.output_tokens,
    e.cache_1h_tokens,
    e.cache_5m_tokens,
    e.cache_read_tokens,
    e.cost_usd
  );
  return result.changes > 0;
}

// OpenAI/OpenRouter처럼 "오늘 누적 사용량" 같이 값이 계속 바뀌는 데이터용.
// 같은 request_id면 최신 값으로 덮어쓴다 (Claude Code처럼 확정된 과거 기록에는 쓰지 않음).
export function upsertUsageEvent(db: DatabaseSync, e: UsageEvent): void {
  const stmt = db.prepare(`
    insert or replace into usage_events
      (request_id, tool, model, session_id, project_path, timestamp,
       input_tokens, output_tokens, cache_1h_tokens, cache_5m_tokens, cache_read_tokens, cost_usd)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    e.request_id,
    e.tool,
    e.model,
    e.session_id,
    e.project_path,
    e.timestamp,
    e.input_tokens,
    e.output_tokens,
    e.cache_1h_tokens,
    e.cache_5m_tokens,
    e.cache_read_tokens,
    e.cost_usd
  );
}
