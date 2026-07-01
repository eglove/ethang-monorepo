import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 77.55,
        functions: 90.99,
        lines: 94.87,
        statements: 94.87
      }
    },
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
