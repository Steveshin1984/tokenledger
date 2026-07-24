import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface TokenLedgerConfig {
  dailyBudgetUsd: number;
  discordWebhookUrl?: string;
  slackWebhookUrl?: string;
}

const DEFAULT_CONFIG: TokenLedgerConfig = {
  dailyBudgetUsd: 5,
};

export function configPath(): string {
  return join(homedir(), ".tokenledger", "config.json");
}

// 없으면 기본값으로 파일을 만들어두고, 있으면 읽어온다.
// 환경변수(DISCORD_WEBHOOK_URL, SLACK_WEBHOOK_URL, TOKENLEDGER_DAILY_BUDGET_USD)가 있으면 그게 우선.
export function loadConfig(): TokenLedgerConfig {
  const path = configPath();
  let fileConfig: Partial<TokenLedgerConfig> = {};

  if (!existsSync(path)) {
    mkdirSync(join(homedir(), ".tokenledger"), { recursive: true });
    writeFileSync(path, JSON.stringify(DEFAULT_CONFIG, null, 2));
  } else {
    try {
      fileConfig = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      // 파일이 깨졌으면 기본값으로 대체
    }
  }

  const config: TokenLedgerConfig = { ...DEFAULT_CONFIG, ...fileConfig };

  if (process.env.TOKENLEDGER_DAILY_BUDGET_USD) {
    const parsed = Number(process.env.TOKENLEDGER_DAILY_BUDGET_USD);
    if (!Number.isNaN(parsed)) config.dailyBudgetUsd = parsed;
  }
  if (process.env.DISCORD_WEBHOOK_URL) config.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (process.env.SLACK_WEBHOOK_URL) config.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  return config;
}
