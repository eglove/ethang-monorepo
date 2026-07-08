import path from "node:path";
import { defineConfig } from "vitest/config";

const toolbeltRoot = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "packages",
  "toolbelt"
);

export default defineConfig({
  resolve: {
    alias: {
      "@ethang/toolbelt/cache/cache-control.js": path.join(
        toolbeltRoot,
        "dist",
        "cache",
        "cache-control.js"
      )
    }
  },
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 74.54,
        functions: 90.4,
        lines: 94.65,
        statements: 94.65
      }
    },
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
