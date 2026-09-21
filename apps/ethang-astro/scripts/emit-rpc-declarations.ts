import { Effect } from "effect";
import compact from "lodash/compact.js";
import join from "lodash/join.js";
import map from "lodash/map.js";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

import { BOUND_APPS, RPC_DECLARATIONS_DIR } from "../src/lib/rpc-typegen.ts";

const appRoot = path.resolve(import.meta.dirname, "..");

const getEmitFailure = (app: string) => {
  const appDirectory = path.resolve(appRoot, "..", app);
  rmSync(path.join(appDirectory, RPC_DECLARATIONS_DIR), {
    force: true,
    recursive: true
  });
  const tscBin = path.join(
    appDirectory,
    "node_modules",
    "typescript",
    "bin",
    "tsc"
  );
  const result = spawnSync(
    process.execPath,
    [tscBin, "-p", "tsconfig.rpc.json"],
    {
      cwd: appDirectory,
      encoding: "utf8"
    }
  );
  if (0 === result.status) {
    return null;
  }
  const output = join(
    compact([result.stdout, result.stderr, result.error?.message]),
    "\n"
  ).slice(0, 4000);

  return `${app} exited ${String(result.status)}:\n${output}`;
};

const failures = compact(
  map(BOUND_APPS, (app) => {
    return getEmitFailure(app);
  })
);

if (0 < failures.length) {
  await Effect.runPromise(Effect.logError(join(failures, "\n")));
  process.exitCode = 1;
}
