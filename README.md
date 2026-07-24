# TokenLedger

내 AI 에이전트들이 어디에 얼마 썼는지 보여주고, 청구서 충격이 오기 전에 알려주는 개인용 AI 지출 추적 도구예요.

- Claude Code, OpenAI, OpenRouter 사용량을 한곳에서 확인
- 프롬프트 내용은 절대 서버로 전송하지 않음 (토큰 수·비용 같은 메타데이터만)
- 로컬 우선 — 모든 데이터는 이 컴퓨터의 `~/.tokenledger/data.db`에만 저장됨
- 일/주/월 → 도구별 → 프로젝트별 → 세션별로 드릴다운하는 대시보드
- 낭비 의심 세션 자동 감지, 예산 초과·급증 알림

> ⚠️ 비공개 베타 단계예요. 아직 npm에 정식 게시되지 않았어요 — 아래 설치 방법을 따라주세요.

## 설치

**요구사항**: Node.js 22.5 이상.

```bash
git clone <이 저장소 주소>
cd tokenledger/cli
npm install
npm run build
npm link
```

설치가 끝나면 터미널 아무 곳에서나 `tokenledger` 명령을 쓸 수 있어요.

## 사용법

```bash
# 1. Claude Code 로그를 스캔해서 로컬 DB에 저장 (OpenAI/OpenRouter는 키가 있으면 같이 수집)
tokenledger init

# 2. 대시보드 열기 (http://localhost:3000)
tokenledger dashboard

# 3. 예산 초과/급증 확인하고 알림 보내기 (설정법: docs/alerts-setup.md)
tokenledger check
```

OpenAI/OpenRouter 연동, 알림 설정은 각각 `docs/api-keys-setup.md`, `docs/alerts-setup.md`를 참고하세요.

## 폴더 구조

| 폴더 | 역할 |
|---|---|
| `cli/` | 사용량 수집 CLI (`tokenledger` 명령) |
| `dashboard/` | 로컬 전용 대시보드 (Next.js, `tokenledger dashboard`로 실행) |
| `web/` | 공개 랜딩페이지 + 웨이트리스트 |
| `docs/` | 설정 가이드, 가격표 등 참고 문서 |

## 피드백

베타 테스트 중 문제가 있거나 의견이 있으면 알려주세요. (연락 방법은 추후 안내)
