import replace from "lodash/replace.js";
import { copyFileSync, writeFileSync } from "node:fs";

import { projectBuilder } from "../project-builder/src/project-builder.ts";
import { updateReadme } from "./src/build/update-readme.js";
import { updateRules } from "./src/build/update-rules.js";

const configFiles = [
  "src/eslint.config.js",
  "src/config.astro.js",
  "src/config.react.js",
  "src/config.solid.js",
  "src/config.angular.js",
  "src/config.storybook.js",
];

await updateRules();
updateReadme();
await projectBuilder(import.meta.dirname, {
  entry: [...configFiles, "src/constants.js"],
  outDir: "dist",
});
copyFileSync("src/README.md", "dist/README.md");

const typeFile = `import type { config } from "typescript-eslint";

declare const _default: ReturnType<typeof config>;
export default _default;
`;

for (const configFile of configFiles) {
  let distributionFile = replace(configFile, "src", "dist");
  distributionFile = replace(distributionFile, ".js", ".d.ts");
  writeFileSync(distributionFile, typeFile);
}
