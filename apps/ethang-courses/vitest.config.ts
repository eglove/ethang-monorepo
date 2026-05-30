import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 93.75,
        functions: 97.36,
        lines: 98.07,
        statements: 98.07
      }
    },
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
