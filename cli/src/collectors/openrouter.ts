import type { UsageEvent } from "../db.js";

// ⚠️ OpenRouter의 일반 API 키로는 "오늘/이번 주/이번 달 누적 사용량" 숫자만
// 받을 수 있고, Claude Code처럼 요청 하나하나의 상세 기록은 얻을 수 없다.
// 그래서 이 함수는 "오늘 하루 총 사용량" 딱 하나만 스냅샷으로 만든다.
// 모델별/프로젝트별 구분도 안 되고, 매번 실행할 때마다 오늘 값을 덮어쓴다.
export async function collectOpenRouterEvents(): Promise<UsageEvent[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log("  (건너뜀) OPENROUTER_API_KEY 환경변수가 설정되어 있지 않아요.");
    return [];
  }

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (err) {
    console.error("  OpenRouter 사용량 조회 실패 (네트워크 오류):", err);
    return [];
  }

  if (!res.ok) {
    console.error(`  OpenRouter 사용량 조회 실패: HTTP ${res.status} ${await res.text()}`);
    return [];
  }

  const body = (await res.json()) as { data?: { usage_daily?: number } };
  const usageDaily = body.data?.usage_daily;
  if (usageDaily == null) {
    console.error("  OpenRouter 응답에 usage_daily 값이 없어요.");
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      request_id: `openrouter-${today}`,
      tool: "openrouter",
      model: "openrouter-all", // 모델별 구분이 안 돼서 하나로 합침
      session_id: today,
      project_path: "openrouter",
      timestamp: new Date().toISOString(),
      input_tokens: 0, // OpenRouter 요약 API는 토큰 수를 안 줌 — 비용만 알 수 있음
      output_tokens: 0,
      cache_1h_tokens: 0,
      cache_5m_tokens: 0,
      cache_read_tokens: 0,
      cost_usd: usageDaily, // OpenRouter 크레딧 ≈ USD
    },
  ];
}
