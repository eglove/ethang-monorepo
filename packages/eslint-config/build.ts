import map from "lodash/map.js";
import replace from "lodash/replace.js";
import { copyFileSync, writeFileSync } from "node:fs";
import { build as tsc } from "tsc-prog";
import { build as tsup } from "tsup";

import { outputConfigs } from "./src/build/output-config.ts";
import { updateReadme } from "./src/build/update-readme.js";
import { updateRules } from "./src/build/update-rules.js";

const configFiles = map(outputConfigs, (c) => {
  return `src/${c.fileName}`;
});

await updateRules();
updateReadme();
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
  include: [...configFiles, "src/constants.js"]
});

await tsup({
  bundle: true,
  clean: false,
  entry: [...configFiles, "src/constants.js"],
  format: ["esm"],
  minify: true,
  outDir: "dist",
  sourcemap: true,
  target: "esnext"
});

copyFileSync("package.json", "dist/package.json");
copyFileSync("src/README.md", "dist/README.md");

const typeFile = `import { defineConfig } from "eslint/config";

declare const _default: Parameters<typeof defineConfig>;
export default _default;
`;

const tailwindTypeFile = `import { defineConfig } from "eslint/config";

declare const _default: (pathToIndex: string) => Parameters<typeof defineConfig>;
export default _default;
`;

for (const configFile of configFiles) {
  let distributionFile = replace(configFile, "src", "dist");
  distributionFile = replace(distributionFile, ".js", ".d.ts");

  if ("src/config.tailwind.js" === configFile) {
    writeFileSync(distributionFile, tailwindTypeFile);
  } else {
    writeFileSync(distributionFile, typeFile);
  }
}
