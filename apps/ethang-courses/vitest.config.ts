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
      exclude: ["src/**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 76.69,
        functions: 92.64,
        lines: 96.09,
        statements: 96.09
      }
    },
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
