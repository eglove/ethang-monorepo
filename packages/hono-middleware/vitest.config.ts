import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 83.33,
        functions: 100,
        lines: 92.85,
        statements: 92.85
      }
    },
    environment: "node"
  }
});
