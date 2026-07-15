import { installCloudflareLogger } from "@ethang/telemetry/logger.ts";
import { parseJson } from "@ethang/toolbelt/json/json.ts";
import { Effect, Schema } from "effect";
import get from "lodash/get.js";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import keys from "lodash/keys.js";
import map from "lodash/map.js";
import startsWith from "lodash/startsWith.js";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

installCloudflareLogger();

export const recursiveSort = (value: unknown): unknown => {
  if (isArray(value)) {
    return map(value, recursiveSort);
  }

  if (isObject(value) && !isNil(value)) {
    const sorted: Record<string, unknown> = {};
    const sortedKeys = keys(value).toSorted((a, b) => {
      return a.localeCompare(b);
    });

    for (const key of sortedKeys) {
      // eslint-disable-next-line @ethang/validate-unknown
      sorted[key] = recursiveSort(get(value, [key]));
    }

    return sorted;
  }

  return value;
};

export const sortJson = (filePath: string) => {
  const workspaceRoot = path.resolve(import.meta.dirname, "../..");
  const absolutePath = path.resolve(workspaceRoot, filePath);

  if (!startsWith(absolutePath, workspaceRoot)) {
    Effect.runSync(Effect.die(new Error("Path is outside of the workspace")));
  }

  if (!existsSync(absolutePath)) {
    Effect.runSync(
      Effect.die(new Error(`File does not exist: ${absolutePath}`))
    );
  }

  const fileContent = readFileSync(absolutePath, "utf8");
  const result = Effect.runSync(
    parseJson(fileContent, Schema.Unknown).pipe(Effect.either)
  );

  if ("Left" === result._tag) {
    Effect.runSync(
      Effect.logError(`Failed to parse JSON ${String(result.left)}`)
    );
    return;
  }

  // eslint-disable-next-line @ethang/validate-unknown
  const sortedJson = recursiveSort(result.right);

  writeFileSync(absolutePath, JSON.stringify(sortedJson, null, 2), "utf8");

  Effect.runSync(Effect.logInfo("Sorted JSON"));
};

export const findFilesRecursively = (
  directory: string,
  filename: string,
  results: string[] = []
): string[] => {
  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (
      entry.isDirectory() &&
      !includes(entryPath, "node_modules") &&
      !includes(entryPath, "dist")
    ) {
      findFilesRecursively(entryPath, filename, results);
    } else if (entry.isFile() && entry.name === filename) {
      results.push(entryPath);
    } else {
      // Ignore other files
    }
  }

  return results;
};
