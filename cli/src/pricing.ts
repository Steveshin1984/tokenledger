// 100만 토큰(1M tokens)당 USD 가격. 출처: docs/pricing-reference.md
export type ModelPricing = {
  input: number;
  output: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
};

const SONNET_5_PROMO_UNTIL = new Date("2026-08-31T00:00:00Z");

function sonnet5Pricing(): ModelPricing {
  const promoActive = new Date() < SONNET_5_PROMO_UNTIL;
  return promoActive
    ? { input: 2.0, output: 10.0, cacheWrite5m: 2.5, cacheWrite1h: 4.0, cacheRead: 0.2 }
    : { input: 3.0, output: 15.0, cacheWrite5m: 3.75, cacheWrite1h: 6.0, cacheRead: 0.3 };
}

export const PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-8": { input: 5.0, output: 25.0, cacheWrite5m: 6.25, cacheWrite1h: 10.0, cacheRead: 0.5 },
  "claude-sonnet-5": sonnet5Pricing(),
  "claude-haiku-4-5": { input: 1.0, output: 5.0, cacheWrite5m: 1.25, cacheWrite1h: 2.0, cacheRead: 0.1 },
};

export function costUsd(model: string, usage: {
  input_tokens: number;
  output_tokens: number;
  cache_1h_tokens: number;
  cache_5m_tokens: number;
  cache_read_tokens: number;
}): number {
  const pricing = PRICING[model];
  if (!pricing) return 0;
  const perToken = 1_000_000;
  return (
    (usage.input_tokens / perToken) * pricing.input +
    (usage.output_tokens / perToken) * pricing.output +
    (usage.cache_1h_tokens / perToken) * pricing.cacheWrite1h +
    (usage.cache_5m_tokens / perToken) * pricing.cacheWrite5m +
    (usage.cache_read_tokens / perToken) * pricing.cacheRead
  );
}
