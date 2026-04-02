import { projectBuilder } from "../project-builder/src/project-builder.ts";

await projectBuilder(import.meta.dirname, {
  entry: ["src", "!src/**/*.test.ts"],
  outDir: "dist",
});
