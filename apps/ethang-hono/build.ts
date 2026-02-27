import { globSync } from "fast-glob";
import reduce from "lodash/reduce.js";
import replace from "lodash/replace.js";
import { copyFileSync } from "node:fs";
import { build as tsup } from "tsup";

copyFileSync(
  "node_modules/flowbite/dist/flowbite.min.js",
  "public/scripts/flowbite/flowbite.min.js",
);

copyFileSync(
  "node_modules/flowbite/dist/flowbite.min.js.map",
  "public/scripts/flowbite/flowbite.min.js.map",
);

const entries = globSync("src/scripts/**/*.ts");
const entryMap = reduce(
  entries,
  (accumulator, entry) => {
    const relativePath = replace(replace(entry, "src/scripts/", ""), ".ts", "");
    accumulator[relativePath] = entry;
    return accumulator;
  },
  {} as Record<string, string>,
);

await tsup({
  bundle: true,
  clean: false,
  entry: entryMap,
  format: ["esm"],
  minify: false,
  outDir: "public/scripts",
  platform: "browser",
  sourcemap: false,
  target: "esnext",
});
