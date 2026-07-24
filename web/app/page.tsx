import { WaitlistForm } from "./waitlist-form";

const painPoints = [
  {
    title: "소비의 불투명성",
    body: "한 문장 답변에 사용량이 59%에서 100%로 갔다. 대체 왜?",
  },
  {
    title: "사후 인지",
    body: "첫 신호가 월말 청구서. 쓸 때는 몰랐다가 청구서 보고 놀란다.",
  },
  {
    title: "낭비 추적 불가",
    body: "루프에 빠진 세션 하나가 몇 분 만에 하루 예산을 다 써도 구분할 방법이 없다.",
  },
  {
    title: "구독자 사각지대",
    body: "/cost 명령과 공식 사용량 분석은 Pro/Max 개인 구독자에게 제공되지 않는다.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center gap-16 px-6 py-24 sm:px-16">
        <section className="flex flex-col items-center gap-6 text-center">
          <span className="rounded-full border border-black/10 px-3 py-1 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-400">
            TokenLedger
          </span>
          <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50 sm:text-4xl">
            내 AI 에이전트들이 어디에 얼마 썼는지, 청구서 오기 전에 알려드립니다
          </h1>
          <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Claude Code, OpenAI, OpenRouter를 섞어 쓰는 개발자를 위한 AI 지출 추적
            대시보드. 설치 1분, 읽기 전용, 프롬프트 내용은 절대 서버로 전송하지
            않습니다.
          </p>
          <WaitlistForm />
        </section>

        <section className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
          {painPoints.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-black/10 p-5 dark:border-white/15"
            >
              <h2 className="mb-1 font-medium text-black dark:text-zinc-50">
                {p.title}
              </h2>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {p.body}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
