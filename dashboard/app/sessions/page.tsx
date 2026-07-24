import Link from "next/link";
import { getSessionsForProject } from "@/lib/db";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;

  if (!project) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-10">
        <p className="text-sm text-zinc-500">프로젝트를 선택해주세요.</p>
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
          ← 대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  const sessions = getSessionsForProject(project);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12 sm:px-10">
      <div>
        <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← 대시보드로 돌아가기
        </Link>
        <h1 className="mt-2 text-xl font-semibold break-all">{project}</h1>
        <p className="mt-1 text-sm text-zinc-500">세션 {sessions.length}개</p>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-zinc-500 dark:border-white/15">
            <th className="py-2 font-normal">세션 시작</th>
            <th className="py-2 font-normal">모델</th>
            <th className="py-2 font-normal">턴 수</th>
            <th className="py-2 font-normal">비용</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.session_id} className="border-b border-black/5 dark:border-white/10">
              <td className="py-2">
                <Link href={`/sessions/${s.session_id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                  {formatDate(s.started_at)}
                </Link>
              </td>
              <td className="py-2">{s.model}</td>
              <td className="py-2">{s.event_count}</td>
              <td className="py-2">${s.cost.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
