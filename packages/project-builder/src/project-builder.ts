import isNil from "lodash/isNil.js";
import { copyFileSync } from "node:fs";
import { chdir } from "node:process";
import { build as tsup } from "tsup";

const packageJsonString = "package.json";

type Options = {
  entry: string[];
  outDir: string;
};

export const projectBuilder = async (basePath: string, options?: Options) => {
  chdir(basePath);
  const config = isNil(options)
    ? ({
        entry: ["src"],
        outDir: "dist",
      } satisfies Options)
    : options;

  await tsup({
    bundle: true,
    clean: true,
    dts: true,
    entry: config.entry,
    format: ["esm"],
    minify: true,
    outDir: config.outDir,
    sourcemap: true,
    target: "esnext",
  });

  copyFileSync(packageJsonString, `${config.outDir}/package.json`);
};
