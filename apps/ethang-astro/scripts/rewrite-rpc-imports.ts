import map from "lodash/map.js";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { BOUND_APPS, GENERATED_TYPES_PATH } from "../src/lib/rpc-typegen.ts";

const rpcBindingLines = map(BOUND_APPS, (app) => {
  const bindingName = app.replaceAll("-", "_");
  const specifier = `../../${app}/dist-types/src/index`;
  return `\t\t${bindingName}: Service<typeof import(${JSON.stringify(
    specifier
  )}).default>;`;
});

const augmentation = [
  "",
  "// RPC bindings typed from sibling declaration outputs (see src/lib/rpc-typegen.ts).",
  "declare namespace Cloudflare {",
  "\tinterface Env {",
  ...rpcBindingLines,
  "\t}",
  "}",
  ""
].join("\n");

const generatedPath = path.resolve(
  import.meta.dirname,
  "..",
  GENERATED_TYPES_PATH
);
const current = readFileSync(generatedPath, "utf8");
if (!current.includes("RPC bindings typed from sibling")) {
  writeFileSync(generatedPath, `${current}${augmentation}`);
}
