#!/usr/bin/env node
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

// 100만 토큰(1M tokens)당 USD 가격. 출처: docs/pricing-reference.md
type ModelPricing = {
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

const PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-8": { input: 5.0, output: 25.0, cacheWrite5m: 6.25, cacheWrite1h: 10.0, cacheRead: 0.5 },
  "claude-sonnet-5": sonnet5Pricing(),
  "claude-haiku-4-5": { input: 1.0, output: 5.0, cacheWrite5m: 1.25, cacheWrite1h: 2.0, cacheRead: 0.1 },
};

interface AssistantUsage {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cache_1h_tokens: number;
  cache_5m_tokens: number;
}

interface ModelTotals {
  input_tokens: number;
  output_tokens: number;
  cache_1h_tokens: number;
  cache_5m_tokens: number;
  cache_read_tokens: number;
  cost: number;
  lineCount: number;
}

function costForLine(u: AssistantUsage): number {
  const pricing = PRICING[u.model];
  if (!pricing) return 0; // 가격표에 없는 모델 — 프로토타입에서는 0으로 처리하고 경고만 출력
  const perToken = 1_000_000;
  return (
    (u.input_tokens / perToken) * pricing.input +
    (u.output_tokens / perToken) * pricing.output +
    (u.cache_1h_tokens / perToken) * pricing.cacheWrite1h +
    (u.cache_5m_tokens / perToken) * pricing.cacheWrite5m +
    (u.cache_read_input_tokens / perToken) * pricing.cacheRead
  );
}

async function parseFile(filePath: string): Promise<void> {
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });

  const totalsByModel = new Map<string, ModelTotals>();
  const unknownModels = new Set<string>();
  let assistantLineCount = 0;
  let parseErrorCount = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    let entry: any;
    try {
      entry = JSON.parse(line);
    } catch {
      parseErrorCount++;
      continue;
    }

    if (entry.type !== "assistant") continue;
    const usage = entry.message?.usage;
    const model = entry.message?.model;
    if (!usage || !model) continue;

    assistantLineCount++;

    const u: AssistantUsage = {
      model,
      input_tokens: usage.input_tokens ?? 0,
      output_tokens: usage.output_tokens ?? 0,
      cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
      cache_1h_tokens: usage.cache_creation?.ephemeral_1h_input_tokens ?? 0,
      cache_5m_tokens: usage.cache_creation?.ephemeral_5m_input_tokens ?? 0,
    };

    if (!PRICING[model]) unknownModels.add(model);

    const totals = totalsByModel.get(model) ?? {
      input_tokens: 0,
      output_tokens: 0,
      cache_1h_tokens: 0,
      cache_5m_tokens: 0,
      cache_read_tokens: 0,
      cost: 0,
      lineCount: 0,
    };
    totals.input_tokens += u.input_tokens;
    totals.output_tokens += u.output_tokens;
    totals.cache_1h_tokens += u.cache_1h_tokens;
    totals.cache_5m_tokens += u.cache_5m_tokens;
    totals.cache_read_tokens += u.cache_read_input_tokens;
    totals.cost += costForLine(u);
    totals.lineCount += 1;
    totalsByModel.set(model, totals);
  }

  console.log(`파일: ${filePath}`);
  console.log(`assistant 줄 수: ${assistantLineCount}${parseErrorCount ? ` (JSON 파싱 실패 ${parseErrorCount}줄 제외)` : ""}`);
  console.log("");

  let grandTotal = 0;
  for (const [model, t] of totalsByModel) {
    console.log(`[${model}] (${t.lineCount}회 응답)`);
    console.log(`  입력 토큰: ${t.input_tokens.toLocaleString()}`);
    console.log(`  출력 토큰: ${t.output_tokens.toLocaleString()}`);
    console.log(`  캐시 쓰기(1h): ${t.cache_1h_tokens.toLocaleString()}  캐시 쓰기(5m): ${t.cache_5m_tokens.toLocaleString()}`);
    console.log(`  캐시 읽기: ${t.cache_read_tokens.toLocaleString()}`);
    console.log(`  예상 비용: $${t.cost.toFixed(4)}`);
    console.log("");
    grandTotal += t.cost;
  }

  if (unknownModels.size > 0) {
    console.log(`⚠️ 가격표에 없는 모델(비용 계산 제외됨): ${[...unknownModels].join(", ")}`);
    console.log("");
  }

  console.log(`총 예상 비용: $${grandTotal.toFixed(4)}`);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("사용법: npm run parse -- <jsonl 파일 경로>");
  process.exit(1);
}

parseFile(filePath).catch((err) => {
  console.error("파싱 중 오류:", err);
  process.exit(1);
});
