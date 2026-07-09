import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 80.76,
        functions: 100,
        lines: 93.02,
        statements: 93.02
      }
    },
    environment: "node"
  }
});
