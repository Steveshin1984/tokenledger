import type { TokenLedgerConfig } from "./config.js";

// Discord/Slack 웹훅으로 메시지를 보낸다. 둘 다 설정 안 됐으면 콘솔에만 출력.
export async function sendAlert(config: TokenLedgerConfig, message: string): Promise<boolean> {
  if (!config.discordWebhookUrl && !config.slackWebhookUrl) {
    console.log(`  (알림 채널 미설정) ${message}`);
    return false;
  }

  let sent = false;

  if (config.discordWebhookUrl) {
    try {
      const res = await fetch(config.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
      if (res.ok) sent = true;
      else console.error(`  Discord 알림 전송 실패: HTTP ${res.status}`);
    } catch (err) {
      console.error("  Discord 알림 전송 실패:", err);
    }
  }

  if (config.slackWebhookUrl) {
    try {
      const res = await fetch(config.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      if (res.ok) sent = true;
      else console.error(`  Slack 알림 전송 실패: HTTP ${res.status}`);
    } catch (err) {
      console.error("  Slack 알림 전송 실패:", err);
    }
  }

  return sent;
}
