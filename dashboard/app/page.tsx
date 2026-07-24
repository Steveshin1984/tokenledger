import Link from "next/link";
import { getCostByTool, getDailyTrend, getMonthlyTotal, getProjectSummaries } from "@/lib/db";
import { DailyTrendChart } from "./daily-trend-chart";
import { ToolPieChart } from "./tool-pie-chart";

// 로컬 DB는 CLI가 계속 갱신하므로, 빌드 시점에 고정되지 않고 매 요청마다 새로 읽는다.
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function Home() {
  const monthlyTotal = getMonthlyTotal();
  const dailyTrend = getDailyTrend();
  const byTool = getCostByTool();
  const projects = getProjectSummaries();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">TokenLedger 대시보드</h1>
        <p className="mt-1 text-sm text-zinc-500">이 컴퓨터에 저장된 사용량 데이터 (~/.tokenledger/data.db)</p>
      </header>

      <section className="rounded-xl border border-black/10 p-6 dark:border-white/15">
        <p className="text-sm text-zinc-500">이번 달 총 비용</p>
        <p className="mt-1 text-4xl font-semibold">${monthlyTotal.toFixed(2)}</p>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-black/10 p-6 dark:border-white/15">
          <h2 className="mb-3 font-medium">최근 30일 일별 추이</h2>
          <DailyTrendChart data={dailyTrend} />
        </section>
        <section className="rounded-xl border border-black/10 p-6 dark:border-white/15">
          <h2 className="mb-3 font-medium">도구별 비용</h2>
          <ToolPieChart data={byTool} />
        </section>
      </div>

      <section className="rounded-xl border border-black/10 p-6 dark:border-white/15">
        <h2 className="mb-3 font-medium">프로젝트별</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-zinc-500">아직 데이터가 없어요. 먼저 `tokenledger init`을 실행하세요.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-500 dark:border-white/15">
                <th className="py-2 font-normal">프로젝트</th>
                <th className="py-2 font-normal">세션 수</th>
                <th className="py-2 font-normal">응답 수</th>
                <th className="py-2 font-normal">비용</th>
                <th className="py-2 font-normal">마지막 활동</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.project_path} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-2">
                    <Link
                      href={`/sessions?project=${encodeURIComponent(p.project_path)}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {p.project_path}
                    </Link>
                  </td>
                  <td className="py-2">{p.session_count}</td>
                  <td className="py-2">{p.event_count}</td>
                  <td className="py-2">${p.cost.toFixed(4)}</td>
                  <td className="py-2 text-zinc-500">{formatDate(p.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
