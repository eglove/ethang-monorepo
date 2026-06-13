import { copyFileSync } from "node:fs";
import { build as tsc } from "tsc-prog";
import { build as tsup } from "tsup";

tsc({
  basePath: ".",
  clean: ["dist"],
  compilerOptions: {
    allowImportingTsExtensions: true,
    allowSyntheticDefaultImports: true,
    declaration: true,
    emitDeclarationOnly: true,
    // @ts-expect-error allowed
    moduleResolution: "bundler",
    outDir: "dist",
    target: "esnext",
    types: ["node"]
  },
  exclude: ["**/*.test.ts"],
  include: ["src"]
});

await tsup({
  bundle: true,
  clean: false,
  entry: ["src", "!src/**/*.test.ts"],
  format: ["esm"],
  minify: true,
  outDir: "dist",
  sourcemap: true,
  target: "esnext"
});

copyFileSync("package.json", "dist/package.json");
