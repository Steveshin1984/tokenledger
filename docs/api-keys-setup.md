# OpenAI / OpenRouter 연동 설정

Claude Code와 달리 이 둘은 로컬 로그 파일이 없어서, 진짜 계정과 API 키가 있어야 사용량을 가져올 수 있어요.

## OpenAI

1. https://platform.openai.com 에 로그인 (조직 소유자여야 함)
2. **Organization Settings → Admin Keys**에서 새 Admin API 키 발급
   - ⚠️ 일반 API 키(`sk-...`)가 아니라 **Admin 키**여야 합니다. 일반 키로는 사용량 조회가 안 돼요.
3. 터미널에서 환경변수로 등록:
   ```
   export OPENAI_ADMIN_KEY="여기에_admin_키"
   ```
4. `tokenledger init` 실행

## OpenRouter

1. https://openrouter.ai/keys 에서 API 키 발급 (일반 키로 충분)
2. 환경변수 등록:
   ```
   export OPENROUTER_API_KEY="여기에_키"
   ```
3. `tokenledger init` 실행

### ⚠️ OpenRouter는 정밀도가 낮아요

OpenRouter의 일반 API 키로는 "오늘 하루 총 사용량" 숫자 하나만 받을 수 있고, Claude Code처럼 요청 하나하나의 기록이나 모델별 구분은 안 돼요. 그래서 대시보드에서 OpenRouter 데이터는:

- 모델이 전부 `openrouter-all`로 뭉쳐서 나옴
- 토큰 수는 항상 0으로 나옴 (비용만 정확함)
- "세션"이 실제 대화 단위가 아니라 하루 단위

더 상세한 데이터가 필요하면 나중에 "management 키"라는 별도 종류의 키로 업그레이드하는 걸 검토할 수 있어요 (v0.2 이후 과제).

## 가격표 관련 주의

`cli/src/openai-pricing.ts`의 OpenAI 모델 가격은 웹 검색으로 조사한 값이라, Claude 가격표만큼 확실하지 않아요. 실제로 연동하기 전에 https://openai.com/api/pricing 에서 최신 값으로 다시 확인해주세요.
