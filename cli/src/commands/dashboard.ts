import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// cli/src/commands/dashboard.ts -> cli/src -> cli -> tokenledger(프로젝트 루트) -> dashboard
function dashboardDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "..", "..", "..", "dashboard");
}

export function runDashboard(): void {
  const dir = dashboardDir();

  if (!existsSync(join(dir, "package.json"))) {
    console.error(`대시보드 앱을 찾을 수 없어요: ${dir}`);
    process.exit(1);
  }

  console.log("대시보드를 시작합니다... (Ctrl+C로 종료)");
  console.log("잠시 후 http://localhost:3000 에서 열립니다.");
  console.log("");

  const child = spawn("npm", ["run", "dev"], {
    cwd: dir,
    stdio: "inherit",
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}
