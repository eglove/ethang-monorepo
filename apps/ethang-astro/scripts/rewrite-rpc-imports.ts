import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  AUGMENTATION_MARKER,
  BOUND_APPS,
  buildRpcAugmentation,
  GENERATED_TYPES_PATH
} from "../src/lib/rpc-typegen.ts";

const generatedPath = path.resolve(
  import.meta.dirname,
  "..",
  GENERATED_TYPES_PATH
);
const current = readFileSync(generatedPath, "utf8");
if (!current.includes(AUGMENTATION_MARKER)) {
  writeFileSync(generatedPath, `${current}${buildRpcAugmentation(BOUND_APPS)}`);
}
