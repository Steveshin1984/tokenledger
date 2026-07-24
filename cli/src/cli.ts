#!/usr/bin/env node
import { runInit } from "./commands/init.js";
import { runDashboard } from "./commands/dashboard.js";
import { runCheck } from "./commands/check.js";

const command = process.argv[2];

switch (command) {
  case "init":
    await runInit();
    break;
  case "dashboard":
    runDashboard();
    break;
  case "check":
    await runCheck();
    break;
  default:
    console.log("사용법: tokenledger <command>");
    console.log("");
    console.log("명령어:");
    console.log("  init        Claude Code / OpenAI / OpenRouter 사용량을 로컬 DB에 저장");
    console.log("  dashboard   로컬 대시보드 실행 (http://localhost:3000)");
    console.log("  check       예산 초과/급증/주간 요약을 확인하고 알림 전송");
    process.exit(command ? 1 : 0);
}
