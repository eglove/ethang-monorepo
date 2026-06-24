import { codebaseMemoryMcp } from "./codebase-memory-mcp.ts";
import { ddd } from "./ddd.ts";
import { everythingSearch } from "./everything-search.ts";
import { githubCli } from "./github-cli.ts";
import { jq } from "./jq.ts";
import { ripgrep } from "./ripgrep.ts";
import { swebok } from "./swebok/swebok.ts";

export const GLOBAL_SKILLS = [
  swebok,
  ddd,
  ripgrep,
  jq,
  everythingSearch,
  githubCli,
  codebaseMemoryMcp
];
