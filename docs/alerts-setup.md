# 알림 설정 (F3)

## 1. 웹훅 URL 만들기 (사용자가 할 일)

**Discord**
1. 알림 받을 채널의 설정(⚙️) → 연동(Integrations) → 웹후크(Webhooks) → 새 웹후크
2. "웹후크 URL 복사"

**Slack**
1. https://api.slack.com/apps 에서 앱 생성 (또는 기존 앱 사용) → Incoming Webhooks 활성화
2. 채널 선택 후 Webhook URL 복사

## 2. TokenLedger에 등록

`~/.tokenledger/config.json` 파일을 열어서 (없으면 `tokenledger check`를 한 번 실행하면 자동 생성돼요) 아래처럼 채워주세요:

```json
{
  "dailyBudgetUsd": 5,
  "discordWebhookUrl": "여기에_디스코드_웹훅_URL",
  "slackWebhookUrl": "여기에_슬랙_웹훅_URL"
}
```

`dailyBudgetUsd`는 하루 예산(달러). 이 값의 80%/100%에 도달하면 알림이 와요. 둘 다 안 채워도 되고, 하나만 채워도 돼요.

환경변수로도 설정 가능: `DISCORD_WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `TOKENLEDGER_DAILY_BUDGET_USD` (설정하면 config.json보다 우선함).

## 3. 자동으로 실행되게 하기 (사용자가 할 일)

`tokenledger check`는 실행할 때마다 딱 한 번만 확인해요 — 항상 켜져 있는 서버가 아니라서, 주기적으로 자동 실행되게 하려면 macOS의 **launchd**나 **cron**에 등록해야 해요.

가장 간단한 방법(cron, 1시간마다):

```bash
crontab -e
```

아래 줄 추가 (경로는 실제 설치 위치에 맞게 조정):

```
0 * * * * cd /Users/mac/tokenledger/cli && npm run cli -- init > /dev/null 2>&1 && npm run cli -- check > /dev/null 2>&1
```

`init`을 먼저 실행해서 최신 데이터를 채운 다음 `check`를 실행하는 순서예요.

## 알림 종류

| 알림 | 조건 | 하루/주 몇 번? |
|---|---|---|
| 예산 80% | 오늘 비용이 일일 예산의 80% 이상 | 하루 1번 |
| 예산 100% | 오늘 비용이 일일 예산을 넘음 | 하루 1번 |
| 급증 감지 | 오늘 시간당 소비 속도가 최근 7일 평균의 3배 이상 | 하루 1번 |
| 주간 요약 | 매주 월요일, 지난 7일 총 사용량 | 주 1번 |

같은 알림은 같은 날(주간 요약은 같은 주)에 중복으로 안 옵니다.
