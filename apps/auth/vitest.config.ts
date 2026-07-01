import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 94.59,
        functions: 100,
        lines: 99.52,
        statements: 99.52
      }
    },
    environment: "node"
  }
});
