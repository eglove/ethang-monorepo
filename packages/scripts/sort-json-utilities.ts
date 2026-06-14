import { parseJson } from "@ethang/toolbelt/json/json.js";
import get from "lodash/get.js";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import keys from "lodash/keys.js";
import map from "lodash/map.js";
import startsWith from "lodash/startsWith.js";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import z from "zod";

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
    throw new Error("Path is outside of the workspace");
  }

  if (!existsSync(absolutePath)) {
    throw new Error(`File does not exist: ${absolutePath}`);
  }

  const fileContent = readFileSync(absolutePath, "utf8");
  // @ts-expect-error allow
  const jsonObject = parseJson(fileContent, z.unknown());

  if (isError(jsonObject)) {
    globalThis.console.error("Failed to parse JSON", jsonObject);
    return;
  }

  const sortedJson = recursiveSort(jsonObject);

  writeFileSync(absolutePath, JSON.stringify(sortedJson, null, 2), "utf8");

  globalThis.console.log("Sorted JSON");
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
      // Do nothing
    }
  }

  return results;
};
