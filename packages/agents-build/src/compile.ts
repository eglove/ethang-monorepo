import { rmSync } from "node:fs";
import path from "node:path";

import { compile, CompileError } from "./compiler-core.ts";
import { GLOBAL_RULES } from "./content/rules/global.ts";
import { GLOBAL_SKILLS } from "./content/skills/global.ts";

const ROOT = path.join(import.meta.dirname, "..", "..", "..");
const JUNIE_DIR = path.join(ROOT, ".junie");
const RULES_DIR = path.join(JUNIE_DIR, "rules");
const SKILLS_DIR = path.join(JUNIE_DIR, "skills");
const MCP_CONFIG_PATH = path.join(JUNIE_DIR, "mcp", "mcp.json");
const MANIFEST_PATH = path.join(JUNIE_DIR, ".manifest.json");

try {
  compile({
    manifestPath: MANIFEST_PATH,
    mcpConfigPath: MCP_CONFIG_PATH,
    rootDir: ROOT,
    rules: GLOBAL_RULES,
    rulesDir: RULES_DIR,
    skills: GLOBAL_SKILLS,
    skillsDir: SKILLS_DIR
  });
  console.log(
    `Generated files for ${String(GLOBAL_RULES.length)} rule(s) and ${String(GLOBAL_SKILLS.length)} skill(s) into ${JUNIE_DIR}`
  );

  const agentsDirectory = path.join(ROOT, ".agents");
  rmSync(agentsDirectory, { force: true, recursive: true });
  console.log(`Cleaned up legacy ${agentsDirectory} directory`);
} catch (error: unknown) {
  if (error instanceof CompileError) {
    for (const failure of error.failures) {
      console.error(`FAIL: ${failure}`);
    }
    process.exit(1);
  }
  throw error;
}
