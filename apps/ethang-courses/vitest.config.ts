import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 81.81,
        functions: 80,
        lines: 86.79,
        statements: 86.79
      }
    },
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
