import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { sortPackageJson as sort } from "sort-package-json";
import { build as tsc } from "tsc-prog";
import { build } from "tsup";

const packageJsonString = "package.json";

export const projectBuilder = async (
  basePath: string,
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  options = {
    entry: ["src"],
    outDir: "dist",
  },
) => {
  process.chdir(basePath);

  const packageJson = readFileSync(packageJsonString, { encoding: "utf8" });
  writeFileSync(packageJsonString, sort(packageJson), "utf8");

  tsc({
    basePath,
    clean: [options.outDir],
    compilerOptions: {
      allowSyntheticDefaultImports: true,
      declaration: true,
      emitDeclarationOnly: true,
      moduleResolution: "node",
      outDir: options.outDir,
      target: "esnext",
    },
    include: options.entry,
  });

  await build({
    bundle: true,
    entry: options.entry,
    format: ["esm"],
    minify: true,
    outDir: options.outDir,
    sourcemap: true,
    target: "esnext",
  });

  copyFileSync(packageJsonString, `${options.outDir}/package.json`);
};
