import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 90.36,
        functions: 86.2,
        lines: 93.59,
        statements: 93.73
      }
    },
    environment: "node"
  }
});
