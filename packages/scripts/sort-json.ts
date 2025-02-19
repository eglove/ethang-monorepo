import isNil from "lodash/isNil.js";

import { sortJson } from "./sort-json-utilities.js";

// eslint-disable-next-line @typescript-eslint/prefer-destructuring
const filePath = globalThis.process.argv[2];

if (isNil(filePath)) {
  globalThis.console.error("No file path provided");
  globalThis.process.exit(1);
}

sortJson(filePath);
