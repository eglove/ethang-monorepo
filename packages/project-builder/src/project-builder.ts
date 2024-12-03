import isNil from "lodash/isNil.js";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
// eslint-disable-next-line n/prefer-global/process
import { chdir } from "node:process";
import { sortPackageJson } from "sort-package-json";
import { build as tsc } from "tsc-prog";
import { build as tsup } from "tsup";

const packageJsonString = "package.json";

type Options = {
  entry: string[];
  outDir: string;
};

export const projectBuilder = async (
  basePath: string,
  options?: Options,
) => {
  chdir(basePath);
  const config = isNil(options)
    ? {
      entry: ["src"],
      outDir: "dist",
    } satisfies Options
    : options;

  const packageJson = readFileSync(packageJsonString, { encoding: "utf8" });
  writeFileSync(packageJsonString, sortPackageJson(packageJson), "utf8");

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
