import { openaiCostUsd } from "../openai-pricing.js";
import type { UsageEvent } from "../db.js";

const API_BASE = "https://api.openai.com/v1";

interface UsageResult {
  model?: string;
  project_id?: string;
  input_tokens: number;
  input_cached_tokens?: number;
  output_tokens: number;
}

interface UsageBucket {
  start_time: number;
  end_time: number;
  results: UsageResult[];
}

interface UsageResponse {
  data: UsageBucket[];
  has_more: boolean;
  next_page: string | null;
}

// OpenAI Admin API로 최근 며칠간의 사용량을 모델/프로젝트별 일 단위로 가져온다.
// OPENAI_ADMIN_KEY 환경변수(Organization Settings -> Admin Keys에서 발급)가 필요.
export async function collectOpenAiEvents(days = 30): Promise<UsageEvent[]> {
  const apiKey = process.env.OPENAI_ADMIN_KEY;
  if (!apiKey) {
    console.log("  (건너뜀) OPENAI_ADMIN_KEY 환경변수가 설정되어 있지 않아요.");
    return [];
  }

  const startTime = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
  const events: UsageEvent[] = [];
  let page: string | undefined;

  for (let i = 0; i < 20; i++) {
    const url = new URL(`${API_BASE}/organization/usage/completions`);
    url.searchParams.set("start_time", String(startTime));
    url.searchParams.set("bucket_width", "1d");
    url.searchParams.append("group_by", "model");
    url.searchParams.append("group_by", "project_id");
    url.searchParams.set("limit", "31");
    if (page) url.searchParams.set("page", page);

    let res: Response;
    try {
      res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    } catch (err) {
      console.error("  OpenAI 사용량 조회 실패 (네트워크 오류):", err);
      return events;
    }

    if (!res.ok) {
      console.error(`  OpenAI 사용량 조회 실패: HTTP ${res.status} ${await res.text()}`);
      return events;
    }

    const body = (await res.json()) as UsageResponse;

    for (const bucket of body.data ?? []) {
      const date = new Date(bucket.start_time * 1000).toISOString();
      for (const result of bucket.results ?? []) {
        const model = result.model ?? "unknown";
        const projectId = result.project_id ?? "default";
        const cachedTokens = result.input_cached_tokens ?? 0;
        const uncachedInput = Math.max(0, result.input_tokens - cachedTokens);

        events.push({
          request_id: `openai-${bucket.start_time}-${model}-${projectId}`,
          tool: "openai",
          model,
          session_id: date.slice(0, 10), // OpenAI는 세션 개념이 없어서 날짜를 세션처럼 씀
          project_path: `openai/${projectId}`,
          timestamp: date,
          input_tokens: uncachedInput,
          output_tokens: result.output_tokens,
          cache_1h_tokens: 0,
          cache_5m_tokens: 0,
          cache_read_tokens: cachedTokens,
          cost_usd: openaiCostUsd(model, {
            input_tokens: result.input_tokens,
            cached_input_tokens: cachedTokens,
            output_tokens: result.output_tokens,
          }),
        });
      }
    }

    if (!body.has_more || !body.next_page) break;
    page = body.next_page;
  }

  return events;
}
