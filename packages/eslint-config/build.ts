import replace from "lodash/replace.js";
import { copyFileSync, writeFileSync } from "node:fs";

import { projectBuilder } from "../project-builder/src/project-builder.ts";
import { updateReadme } from "./src/build/update-readme.js";
import { updateRules } from "./src/build/update-rules.js";

const configFiles = [
  "src/config.main.js",
  "src/config.html.js",
  "src/config.astro.js",
  "src/config.react.js",
  "src/config.solid.js",
  "src/config.angular.js",
  "src/config.storybook.js",
  "src/config.tailwind.js",
];

await updateRules();
updateReadme();
await projectBuilder(import.meta.dirname, {
  entry: [...configFiles, "src/constants.js"],
  outDir: "dist",
});
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
