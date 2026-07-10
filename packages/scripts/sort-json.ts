import { installCloudflareLogger } from "@ethang/telemetry/logger.ts";
import { Effect } from "effect";
import isNil from "lodash/isNil.js";
import startsWith from "lodash/startsWith.js";
import { existsSync } from "node:fs";
import path from "node:path";

import { sortJson } from "./sort-json-utilities.ts";

installCloudflareLogger();

export const run = (argv: string[]): void => {
  const { 2: filePath } = argv;

  if (isNil(filePath)) {
    Effect.runSync(Effect.logError("No file path provided"));
    globalThis.process.exit(1);
  }

  const workspaceRoot = path.resolve(import.meta.dirname, "../..");
  const absolutePath = path.resolve(workspaceRoot, filePath);

  if (!startsWith(absolutePath, workspaceRoot)) {
    Effect.runSync(Effect.logError("Path is outside the repository workspace"));
    globalThis.process.exit(1);
  }

  if (!existsSync(absolutePath)) {
    Effect.runSync(Effect.logError(`File does not exist: ${absolutePath}`));
    globalThis.process.exit(1);
  }

  sortJson(absolutePath);
};

if ("test" !== globalThis.process.env["NODE_ENV"]) {
  run(globalThis.process.argv);
}
