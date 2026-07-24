import Link from "next/link";
import { getSessionEvents } from "@/lib/db";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = getSessionEvents(id);

  if (events.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-10">
        <p className="text-sm text-zinc-500">세션을 찾을 수 없어요.</p>
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
          ← 대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  const totalCost = events.reduce((sum, e) => sum + e.cost_usd, 0);
  const { project_path } = events[0];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <Link
          href={`/sessions?project=${encodeURIComponent(project_path)}`}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          ← 세션 목록으로 돌아가기
        </Link>
        <h1 className="mt-2 text-xl font-semibold">세션 상세</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {events.length}개 턴 · 총 비용 ${totalCost.toFixed(4)}
        </p>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-zinc-500 dark:border-white/15">
            <th className="py-2 font-normal">시각</th>
            <th className="py-2 font-normal">입력</th>
            <th className="py-2 font-normal">출력</th>
            <th className="py-2 font-normal">캐시 쓰기(1h/5m)</th>
            <th className="py-2 font-normal">캐시 읽기</th>
            <th className="py-2 font-normal">비용</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.request_id} className="border-b border-black/5 dark:border-white/10">
              <td className="py-2">{formatTime(e.timestamp)}</td>
              <td className="py-2">{e.input_tokens.toLocaleString()}</td>
              <td className="py-2">{e.output_tokens.toLocaleString()}</td>
              <td className="py-2">
                {e.cache_1h_tokens.toLocaleString()} / {e.cache_5m_tokens.toLocaleString()}
              </td>
              <td className="py-2">{e.cache_read_tokens.toLocaleString()}</td>
              <td className="py-2">${e.cost_usd.toFixed(5)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
