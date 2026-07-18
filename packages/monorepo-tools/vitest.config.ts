import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/cli/run-workspace.worker.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html", "lcov"],
      thresholds: {
        autoUpdate: false,
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100
      }
    },
    environment: "node"
  }
});
