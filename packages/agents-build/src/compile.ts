import { rmSync } from "node:fs";
import path from "node:path";

import { compile, CompileError } from "./compiler-core.ts";
import { GLOBAL_RULES } from "./content/rules/global.ts";
import { GLOBAL_SKILLS } from "./content/skills/global.ts";

const ROOT = path.join(import.meta.dirname, "..", "..", "..");
const AGENTS_DIR = path.join(ROOT, ".agents");
const GITHUB_DIR = path.join(ROOT, ".github");
const RULES_DIR = path.join(GITHUB_DIR, "instructions");
const SKILLS_DIR = path.join(AGENTS_DIR, "skills");
const MCP_PUBLIC_PATH = path.join(GITHUB_DIR, "mcp.json");
const HOOKS_PATH = path.join(GITHUB_DIR, "hooks", "skills.json");
const MANIFEST_PATH = path.join(AGENTS_DIR, ".manifest.json");

try {
  compile({
    hooksPath: HOOKS_PATH,
    manifestPath: MANIFEST_PATH,
    mcpPublicPath: MCP_PUBLIC_PATH,
    rootDir: ROOT,
    rules: GLOBAL_RULES,
    rulesDir: RULES_DIR,
    skills: GLOBAL_SKILLS,
    skillsDir: SKILLS_DIR
  });
  console.log(
    `Generated files for ${String(GLOBAL_RULES.length)} rule(s) and ${String(GLOBAL_SKILLS.length)} skill(s) into ${AGENTS_DIR}`
  );

  const junieDirectory = path.join(ROOT, ".junie");
  rmSync(junieDirectory, { force: true, recursive: true });
  console.log(`Cleaned up legacy ${junieDirectory} directory`);
} catch (error: unknown) {
  if (error instanceof CompileError) {
    for (const failure of error.failures) {
      console.error(`FAIL: ${failure}`);
    }
    process.exit(1);
  }
  throw error;
}
