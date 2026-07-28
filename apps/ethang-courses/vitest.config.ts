import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      thresholds: {

        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
