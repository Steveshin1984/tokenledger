import { WaitlistForm } from "./waitlist-form";
import { TerminalPreview } from "./terminal-preview";

const painPoints = [
  {
    stat: "59% → 100%",
    title: "소비의 불투명성",
    body: "한 문장 답변에 사용량이 59%에서 100%로 갔다. 대체 왜?",
  },
  {
    stat: "D+30",
    title: "사후 인지",
    body: "첫 신호가 월말 청구서. 쓸 때는 몰랐다가 청구서 보고 놀란다.",
  },
  {
    stat: "0 → $12",
    title: "낭비 추적 불가",
    body: "루프에 빠진 세션 하나가 몇 분 만에 하루 예산을 다 써도 구분할 방법이 없다.",
  },
  {
    stat: "N/A",
    title: "구독자 사각지대",
    body: "/cost 명령과 공식 사용량 분석은 Pro/Max 개인 구독자에게 제공되지 않는다.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center font-sans">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center gap-20 px-6 py-24 sm:px-16">
        <section className="flex flex-col items-center gap-6 text-center">
          <span className="rounded-full border border-border px-3 py-1 font-mono text-xs tracking-wide text-accent">
            [ WAITLIST OPEN ]
          </span>
          <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            내 AI 에이전트들이 어디에 얼마 썼는지,{" "}
            <span className="text-accent">청구서 오기 전에</span> 알려드립니다
          </h1>
          <p className="max-w-lg text-lg leading-8 text-muted">
            Claude Code, OpenAI, OpenRouter를 섞어 쓰는 개발자를 위한 AI 지출 추적
            대시보드. 설치 1분, 읽기 전용, 프롬프트 내용은 절대 서버로 전송하지
            않습니다.
          </p>

          <TerminalPreview />

          <WaitlistForm />
        </section>

        <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {painPoints.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-border bg-white/[0.02] p-5 transition-colors hover:border-white/20"
            >
              <div className="mb-2 font-mono text-xs text-accent">{p.stat}</div>
              <h2 className="mb-1 font-medium text-foreground">{p.title}</h2>
              <p className="text-sm leading-6 text-muted">{p.body}</p>
            </div>
          ))}
        </section>

        <footer className="text-xs text-muted">TokenLedger — 개인 개발자를 위한 AI 비용 가계부</footer>
      </main>
    </div>
  );
}
