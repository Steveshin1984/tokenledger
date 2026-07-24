import { loadConfig } from "../config.js";
import { hasAlertBeenSent, openDb, recordAlertSent } from "../db.js";
import { sendAlert } from "../notify.js";

const SPIKE_MULTIPLIER = 3;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// 지난 7일(오늘 제외) 총 비용 -> 하루 평균, 시간당 평균
function getPastWeekHourlyRate(db: ReturnType<typeof openDb>, today: string): number {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  const row = db
    .prepare(
      `select coalesce(sum(cost_usd), 0) as cost
       from usage_events
       where timestamp >= ? and substr(timestamp, 1, 10) < ?`
    )
    .get(sevenDaysAgo.toISOString(), today) as { cost: number };
  return row.cost / 7 / 24;
}

export async function runCheck(): Promise<void> {
  const db = openDb();
  const config = loadConfig();
  const today = todayStr();

  const todayRow = db
    .prepare("select coalesce(sum(cost_usd), 0) as cost from usage_events where substr(timestamp, 1, 10) = ?")
    .get(today) as { cost: number };
  const todayCost = todayRow.cost;
  const budget = config.dailyBudgetUsd;
  const pct = budget > 0 ? (todayCost / budget) * 100 : 0;

  console.log(`오늘 사용량: $${todayCost.toFixed(4)} / 예산 $${budget} (${pct.toFixed(0)}%)`);

  // 1. 예산 임계치 알림 — 80%, 100% 각각 하루 한 번씩만. 둘 다 넘었으면 둘 다 보냄(80% 먼저).
  if (pct >= 80 && !hasAlertBeenSent(db, "budget_80", today)) {
    await sendAlert(
      config,
      `⚠️ TokenLedger: 오늘 AI 사용 비용이 일일 예산의 ${pct.toFixed(0)}%에 도달했어요. ($${todayCost.toFixed(2)} / $${budget})`
    );
    recordAlertSent(db, "budget_80", today);
  }
  if (pct >= 100 && !hasAlertBeenSent(db, "budget_100", today)) {
    await sendAlert(
      config,
      `🚨 TokenLedger: 오늘 AI 사용 비용이 일일 예산 $${budget}을 넘었어요. 현재 $${todayCost.toFixed(2)} (${pct.toFixed(0)}%)`
    );
    recordAlertSent(db, "budget_100", today);
  }

  // 2. 급증 감지: 오늘 시간당 소비 속도 vs 직전 7일 평균 시간당 속도
  const hoursElapsedToday = Math.max(1, (Date.now() - new Date(`${today}T00:00:00Z`).getTime()) / 3_600_000);
  const todayHourlyRate = todayCost / hoursElapsedToday;
  const avgHourlyRate = getPastWeekHourlyRate(db, today);

  if (avgHourlyRate > 0 && todayHourlyRate >= avgHourlyRate * SPIKE_MULTIPLIER && !hasAlertBeenSent(db, "spike", today)) {
    const multiplier = todayHourlyRate / avgHourlyRate;
    await sendAlert(
      config,
      `📈 TokenLedger: 오늘 소비 속도가 최근 7일 평균의 ${multiplier.toFixed(1)}배예요. 루프에 빠진 세션이 없는지 확인해보세요.`
    );
    recordAlertSent(db, "spike", today);
  }

  // 3. 주간 요약 (매주 월요일에 한 번)
  const isMonday = new Date().getUTCDay() === 1;
  if (isMonday && !hasAlertBeenSent(db, "weekly_summary", today)) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    const weekRow = db
      .prepare("select coalesce(sum(cost_usd), 0) as cost, count(*) as n from usage_events where timestamp >= ?")
      .get(sevenDaysAgo.toISOString()) as { cost: number; n: number };
    const byTool = db
      .prepare(
        `select tool, sum(cost_usd) as cost from usage_events where timestamp >= ? group by tool order by cost desc`
      )
      .all(sevenDaysAgo.toISOString()) as { tool: string; cost: number }[];

    const breakdown = byTool.map((t) => `${t.tool} $${t.cost.toFixed(2)}`).join(", ");
    await sendAlert(
      config,
      `📊 TokenLedger 주간 요약: 지난 7일간 총 $${weekRow.cost.toFixed(2)} 사용 (${weekRow.n}건)\n${breakdown}`
    );
    recordAlertSent(db, "weekly_summary", today);
  }

  db.close();
}
