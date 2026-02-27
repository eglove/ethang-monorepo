import { globSync } from "fast-glob";
import reduce from "lodash/reduce.js";
import replace from "lodash/replace.js";
import { build as tsup } from "tsup";

export const buildScripts = async (watch = false) => {
  const entries = globSync("src/scripts/**/*.ts");
  const entryMap = reduce(
    entries,
    (accumulator, entry) => {
      const relativePath = replace(
        replace(entry, "src/scripts/", ""),
        ".ts",
        "",
      );
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
    watch,
  });
};
