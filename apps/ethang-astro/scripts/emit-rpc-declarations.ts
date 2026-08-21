import { Effect } from "effect";
import compact from "lodash/compact.js";
import join from "lodash/join.js";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

import { BOUND_APPS, RPC_DECLARATIONS_DIR } from "../src/lib/rpc-typegen.ts";

const appRoot = path.resolve(import.meta.dirname, "..");

const failures: string[] = [];
for (const app of BOUND_APPS) {
  const appDirectory = path.resolve(appRoot, "..", app);
  rmSync(path.join(appDirectory, RPC_DECLARATIONS_DIR), {
    force: true,
    recursive: true
  });
  const result = spawnSync("pnpm exec tsc -p tsconfig.rpc.json", {
    cwd: appDirectory,
    encoding: "utf8",
    shell: true
  });
  if (0 !== result.status) {
    const output = join(compact([result.stdout, result.stderr]), "\n").slice(
      0,
      4000
    );
    failures.push(`${app} exited ${String(result.status)}:\n${output}`);
  }
}

if (0 < failures.length) {
  await Effect.runPromise(Effect.logError(join(failures, "\n")));
  process.exitCode = 1;
}
