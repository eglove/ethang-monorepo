import path from "node:path";

import { compile, CompileError } from "./compiler-core.ts";
import { GLOBAL_RULES } from "./content/rules/global.ts";

const ROOT = path.join(import.meta.dirname, "..", "..", "..");
const AGENTS_DIR = path.join(ROOT, ".agents");
const RULES_DIR = path.join(AGENTS_DIR, "rules");
const MANIFEST_PATH = path.join(AGENTS_DIR, ".manifest.json");

try {
  compile({
    manifestPath: MANIFEST_PATH,
    rootDir: ROOT,
    rules: GLOBAL_RULES,
    rulesDir: RULES_DIR
  });
  console.log(
    `Generated files for ${String(GLOBAL_RULES.length)} rule(s) into ${RULES_DIR}`
  );
} catch (error: unknown) {
  if (error instanceof CompileError) {
    for (const failure of error.failures) {
      console.error(`FAIL: ${failure}`);
    }
    process.exit(1);
  }
  throw error;
}
