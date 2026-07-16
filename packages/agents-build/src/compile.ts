import { Effect } from "effect";
import { rmSync } from "node:fs";
import path from "node:path";

import { compile, CompileError } from "./compiler-core.ts";
import { GLOBAL_RULES } from "./content/rules/global.ts";
import { GLOBAL_SKILLS } from "./content/skills/global.ts";

const ROOT = path.join(import.meta.dirname, "..", "..", "..");
const AGENTS_DIR = path.join(ROOT, ".agents");
const GITHUB_DIR = path.join(ROOT, ".github");
const RULES_DIR = path.join(GITHUB_DIR, "instructions");
const SKILLS_DIR = path.join(GITHUB_DIR, "skills");
const MCP_PUBLIC_PATH = path.join(GITHUB_DIR, "mcp.json");
const HOOKS_PATH = path.join(GITHUB_DIR, "hooks", "skills.json");
const MANIFEST_PATH = path.join(AGENTS_DIR, ".manifest.json");

const main = Effect.try({
  catch: (error: unknown) => {
    if (error instanceof CompileError) {
      for (const failure of error.failures) {
        Effect.runSync(Effect.logError(`FAIL: ${failure}`));
      }
      process.exit(1);
    }
    // eslint-disable-next-line @ethang/no-try-catch -- re-throw unhandled errors for top-level crash
    throw error;
  },
  try: () => {
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
    Effect.runSync(
      Effect.logInfo(
        `Generated files for ${String(GLOBAL_RULES.length)} rule(s) and ${String(GLOBAL_SKILLS.length)} skill(s) into ${AGENTS_DIR}`
      )
    );

    const junieDirectory = path.join(ROOT, ".junie");
    rmSync(junieDirectory, { force: true, recursive: true });
    Effect.runSync(
      Effect.logInfo(`Cleaned up legacy ${junieDirectory} directory`)
    );
  }
});

Effect.runSync(main);
