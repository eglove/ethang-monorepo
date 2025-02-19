import get from "lodash/get.js";

import { findFilesRecursively, sortJson } from "./sort-json-utilities.js";

const directory = get(globalThis, ["process", "argv", 2]);
const filename = get(globalThis, ["process", "argv", 3]);

const matchingFiles = findFilesRecursively(directory, filename);

for (const matchingFile of matchingFiles) {
  sortJson(matchingFile);
}
