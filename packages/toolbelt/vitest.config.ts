import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 61.64,
        functions: 57.14,
        lines: 63.97,
        statements: 63.97,
      },
    },
    environment: "node",
  },
});
