import { collectClaudeCodeEvents } from "../collectors/claude-code.js";
import { dbPath, insertUsageEvent, openDb } from "../db.js";

export function runInit(): void {
  const db = openDb();

  const events = collectClaudeCodeEvents();
  let inserted = 0;
  let skipped = 0;

  for (const event of events) {
    if (insertUsageEvent(db, event)) inserted++;
    else skipped++;
  }

  const totalRow = db.prepare("select count(*) as count, coalesce(sum(cost_usd), 0) as cost from usage_events").get() as {
    count: number;
    cost: number;
  };

  db.close();

  console.log(`Claude Code 로그 스캔 완료 (${events.length}개 응답 발견)`);
  console.log(`  새로 저장: ${inserted}개`);
  console.log(`  이미 있어서 건너뜀: ${skipped}개`);
  console.log("");
  console.log(`저장 위치: ${dbPath()}`);
  console.log(`전체 누적: ${totalRow.count}개 응답, 예상 비용 $${totalRow.cost.toFixed(4)}`);
}
