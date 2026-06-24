import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 100,
        functions: 98.43,
        lines: 99.35,
        statements: 99.35
      }
    },
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
