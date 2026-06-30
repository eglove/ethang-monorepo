import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 85.13,
        functions: 100,
        lines: 97.14,
        statements: 97.14
      }
    },
    environment: "node"
  }
});
