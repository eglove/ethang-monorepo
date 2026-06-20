import { atddFsmTdd } from "./atdd-fsm-tdd.ts";
import { codebaseMemoryMcp } from "./codebase-memory-mcp.ts";
import { commit } from "./commit.ts";
import { ddd } from "./ddd.ts";
import { everythingSearch } from "./everything-search.ts";
import { githubCli } from "./github-cli.ts";
import { jq } from "./jq.ts";
import { lint } from "./lint.ts";
import { ripgrep } from "./ripgrep.ts";
import { saraCli } from "./sara-cli.ts";
import { sdlc } from "./sdlc.ts";
import { swebok } from "./swebok/swebok.ts";
import { webstormMcp } from "./webstorm-mcp/webstorm-mcp.ts";

export const GLOBAL_SKILLS = [
  sdlc,
  swebok,
  atddFsmTdd,
  ddd,
  commit,
  lint,
  webstormMcp,
  ripgrep,
  jq,
  everythingSearch,
  githubCli,
  saraCli,
  codebaseMemoryMcp
];
