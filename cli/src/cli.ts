#!/usr/bin/env node
import { runInit } from "./commands/init.js";
import { runDashboard } from "./commands/dashboard.js";

const command = process.argv[2];

switch (command) {
  case "init":
    runInit();
    break;
  case "dashboard":
    runDashboard();
    break;
  default:
    console.log("사용법: tokenledger <command>");
    console.log("");
    console.log("명령어:");
    console.log("  init        Claude Code 로그를 스캔해서 로컬 DB에 저장");
    console.log("  dashboard   로컬 대시보드 실행 (http://localhost:3000)");
    process.exit(command ? 1 : 0);
}
