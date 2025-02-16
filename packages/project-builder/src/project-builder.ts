import isNil from "lodash/isNil.js";
import { copyFileSync } from "node:fs";
import { chdir } from "node:process";
import { build as tsc } from "tsc-prog";
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

  tsc({
    basePath,
    clean: [config.outDir],
    compilerOptions: {
      allowSyntheticDefaultImports: true,
      declaration: true,
      emitDeclarationOnly: true,
      moduleResolution: "node",
      outDir: config.outDir,
      target: "esnext",
    },
    include: config.entry,
  });

  await tsup({
    bundle: true,
    entry: config.entry,
    format: ["esm"],
    minify: true,
    outDir: config.outDir,
    sourcemap: true,
    target: "esnext",
  });

  copyFileSync(packageJsonString, `${config.outDir}/package.json`);
};
