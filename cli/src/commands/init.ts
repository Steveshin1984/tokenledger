import { collectClaudeCodeEvents } from "../collectors/claude-code.js";
import { collectOpenAiEvents } from "../collectors/openai.js";
import { collectOpenRouterEvents } from "../collectors/openrouter.js";
import { dbPath, insertUsageEvent, openDb, upsertUsageEvent } from "../db.js";

export async function runInit(): Promise<void> {
  const db = openDb();

  console.log("Claude Code 로그 스캔 중...");
  const claudeCodeEvents = collectClaudeCodeEvents();
  let inserted = 0;
  let skipped = 0;
  for (const event of claudeCodeEvents) {
    if (insertUsageEvent(db, event)) inserted++;
    else skipped++;
  }
  console.log(`  ${claudeCodeEvents.length}개 응답 발견 (새로 저장 ${inserted}개, 건너뜀 ${skipped}개)`);

  console.log("OpenAI 사용량 조회 중...");
  const openAiEvents = await collectOpenAiEvents();
  let openAiUpserted = 0;
  for (const event of openAiEvents) {
    upsertUsageEvent(db, event);
    openAiUpserted++;
  }
  if (openAiEvents.length > 0) console.log(`  ${openAiUpserted}개 일별 기록 저장/갱신`);

  console.log("OpenRouter 사용량 조회 중...");
  const openRouterEvents = await collectOpenRouterEvents();
  for (const event of openRouterEvents) {
    upsertUsageEvent(db, event);
  }
  if (openRouterEvents.length > 0) console.log(`  오늘(${openRouterEvents[0].session_id}) 사용량 저장/갱신`);

  const totalRow = db.prepare("select count(*) as count, coalesce(sum(cost_usd), 0) as cost from usage_events").get() as {
    count: number;
    cost: number;
  };

  db.close();

  console.log("");
  console.log(`저장 위치: ${dbPath()}`);
  console.log(`전체 누적: ${totalRow.count}개 기록, 예상 비용 $${totalRow.cost.toFixed(4)}`);
}
