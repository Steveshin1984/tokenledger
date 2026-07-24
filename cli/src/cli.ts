#!/usr/bin/env node
import { runInit } from "./commands/init.js";

const command = process.argv[2];

switch (command) {
  case "init":
    runInit();
    break;
  default:
    console.log("사용법: tokenledger <command>");
    console.log("");
    console.log("명령어:");
    console.log("  init   Claude Code 로그를 스캔해서 로컬 DB에 저장");
    process.exit(command ? 1 : 0);
}
