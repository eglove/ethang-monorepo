import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 81.81,
        functions: 100,
        lines: 91.42,
        statements: 91.42
      }
    },
    environment: "node"
  }
});
