const LINES = [
  { prompt: true, text: "npx tokenledger init" },
  { text: "Claude Code 로그 스캔 중..." },
  { text: "  186개 응답 발견 (새로 저장 186개)" },
  { text: "OpenAI 사용량 조회 중..." },
  { text: "  62개 일별 기록 저장" },
  { text: "낭비 감지 분석 중..." },
  { text: "  낭비 의심 세션 2개 발견", accent: true },
  { text: "" },
  { text: "저장 위치: ~/.tokenledger/data.db", muted: true },
  { text: "전체 누적: 248개 기록, 예상 비용 $6.42", bold: true },
];

export function TerminalPreview() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-black/60 text-left shadow-2xl shadow-black/50">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
      </div>
      <div className="overflow-x-auto whitespace-pre px-4 py-4 font-mono text-[13px] leading-6">
        {LINES.map((line, i) => (
          <div
            key={i}
            className={
              line.accent
                ? "text-accent"
                : line.bold
                  ? "font-semibold text-foreground"
                  : line.muted
                    ? "text-muted"
                    : "text-zinc-300"
            }
          >
            {line.prompt ? <span className="text-accent">$ </span> : null}
            {line.text || " "}
          </div>
        ))}
      </div>
    </div>
  );
}
