import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  GENERATED_TYPES_FILENAME,
  rewriteServiceBindingImports
} from "../src/lib/rpc-typegen.ts";

const generatedPath = path.resolve(
  import.meta.dirname,
  "..",
  GENERATED_TYPES_FILENAME
);

writeFileSync(
  generatedPath,
  rewriteServiceBindingImports(readFileSync(generatedPath, "utf8"))
);
