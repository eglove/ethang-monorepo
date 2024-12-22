import { copyFileSync } from "node:fs";

import { projectBuilder } from "../project-builder/src/project-builder.ts";
import { updateReadme } from "./src/build/update-readme.js";
import { updateRules } from "./src/build/update-rules.js";

await updateRules();
updateReadme();
await projectBuilder(import.meta.dirname, {
  entry: [
    "src/eslint.config.js",
    "src/config.astro.js",
    "src/config.react.js",
    "src/config.solid.js",
    "src/config.angular.js",
    "src/constants.js",
  ],
  outDir: "dist",
});
copyFileSync("src/README.md", "dist/README.md");
