// ⚠️ 이 가격표는 웹 검색으로 조사한 값이라 Anthropic 것만큼 확실하지 않습니다.
// 실제로 OpenAI 계정을 연결하기 전에 https://openai.com/api/pricing 에서 다시 확인하세요.
// 100만 토큰(1M tokens)당 USD.
export interface OpenAiModelPricing {
  input: number;
  cacheRead: number;
  output: number;
}

export const OPENAI_PRICING: Record<string, OpenAiModelPricing> = {
  "gpt-5.5": { input: 5.0, cacheRead: 2.5, output: 30.0 },
  "gpt-5.4": { input: 2.5, cacheRead: 1.25, output: 15.0 },
  "gpt-4.1": { input: 2.0, cacheRead: 0.5, output: 8.0 },
  "gpt-4.1-mini": { input: 0.4, cacheRead: 0.1, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, cacheRead: 0.025, output: 0.4 },
  "gpt-4o": { input: 2.5, cacheRead: 1.25, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, cacheRead: 0.075, output: 0.6 },
};

export function openaiCostUsd(
  model: string,
  usage: { input_tokens: number; cached_input_tokens: number; output_tokens: number }
): number {
  const pricing = OPENAI_PRICING[model];
  if (!pricing) return 0;
  const perToken = 1_000_000;
  const uncachedInput = Math.max(0, usage.input_tokens - usage.cached_input_tokens);
  return (
    (uncachedInput / perToken) * pricing.input +
    (usage.cached_input_tokens / perToken) * pricing.cacheRead +
    (usage.output_tokens / perToken) * pricing.output
  );
}
