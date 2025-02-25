import { projectBuilder } from "@ethang/project-builder/project-builder.js";

await projectBuilder(import.meta.dirname, {
  entry: ["src/index.ts"],
  outDir: "dist",
});
