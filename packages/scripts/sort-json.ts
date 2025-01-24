import { readFileSync, writeFileSync } from "fs";
import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";
import isArray from "lodash/isArray.js";
import isObject from "lodash/isObject.js";
import isNil from "lodash/isNil.js";
import * as process from "node:process";

const recursiveSort = <T>(obj: T): T => {
  if (isArray(obj)) {
    return obj.map(recursiveSort) as T;
  } else if (isObject(obj)) {
    return Object.keys(obj)
      .sort()
      .reduce((sorted, key) => {
        // @ts-expect-error ignore
        sorted[key] = recursiveSort(obj[key]);
        return sorted;
      }, {} as T);
  }

  return obj as T;
};

export const sortJson = (filePath: string) => {
  const fileContent = readFileSync(filePath, "utf8");
  const jsonObject = attempt(JSON.parse, fileContent);

  if (isError(jsonObject)) {
    console.error("Failed to parse JSON", jsonObject);
    return;
  }

  const sortedJson = recursiveSort(jsonObject);

  writeFileSync(filePath, JSON.stringify(sortedJson, null, 2), "utf8");

  console.log("Sorted JSON");
};

const filePath = process.argv[2];

if (isNil(filePath)) {
  console.error("No file path provided");
  process.exit(1);
}

sortJson(filePath);
