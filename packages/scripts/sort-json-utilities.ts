import { parseJson } from "@ethang/toolbelt/json/json.js";
import get from "lodash/get.js";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isError from "lodash/isError.js";
import isObject from "lodash/isObject.js";
import keys from "lodash/keys.js";
import map from "lodash/map.js";
import reduce from "lodash/reduce.js";
import set from "lodash/set.js";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import z from "zod";

const recursiveSort = <T extends object>(object: T): T => {
  if (isArray(object)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return map(object, recursiveSort) as T;
  }

  if (isObject(object)) {
    return reduce(
      keys(object).toSorted((a, b) => a.localeCompare(b)),
      (sorted, key) => {
        set(sorted, key, recursiveSort(get(object, [key])));
        return sorted;
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as T,
    );
  }

  return object;
};

export const sortJson = (filePath: string) => {
  const fileContent = readFileSync(filePath, "utf8");
  const jsonObject = parseJson(fileContent, z.unknown());

  if (isError(jsonObject)) {
    globalThis.console.error("Failed to parse JSON", jsonObject);
    return;
  }

  // @ts-expect-error assume object
  const sortedJson = recursiveSort(jsonObject);

  writeFileSync(filePath, JSON.stringify(sortedJson, null, 2), "utf8");

  globalThis.console.log("Sorted JSON");
};

export const findFilesRecursively = (
  directory: string,
  filename: string,
  results: string[] = [],
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
      // Do nothing
    }
  }

  return results;
};
