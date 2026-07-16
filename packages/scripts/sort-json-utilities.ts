import { installLogger } from "@ethang/telemetry/logger.ts";
import { Effect, Schema } from "effect";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import startsWith from "lodash/startsWith.js";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

installLogger();

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return !isNil(value) && isObject(value) && !isArray(value);
};

const sortReplacer = (_key: string, value: unknown) => {
  if (!isPlainObject(value)) {
    return value;
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(value).toSorted((a, b) => {
    return a.localeCompare(b);
  });

  for (const key of keys) {
    sorted[key] = value[key];
  }

  return sorted;
};

export const recursiveSort = (value: unknown) => {
  // eslint-disable-next-line @ethang/validate-unknown
  return JSON.parse(JSON.stringify(value, sortReplacer));
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
    Schema.decodeUnknown(Schema.parseJson(Schema.Unknown))(fileContent).pipe(
      Effect.either
    )
  );

  if ("Left" === result._tag) {
    Effect.runSync(
      Effect.logError(`Failed to parse JSON ${String(result.left)}`)
    );
    return;
  }

  // eslint-disable-next-line @ethang/validate-unknown
  const sortedJson: unknown = recursiveSort(result.right);

  writeFileSync(absolutePath, JSON.stringify(sortedJson, null, 2), "utf8");

  Effect.runSync(Effect.logInfo("Sorted JSON"));
};

export const findFilesRecursively = (
  directory: string,
  filename: string,
  results: string[] = []
) => {
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
