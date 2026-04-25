import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 94.91,
        functions: 88.57,
        lines: 93.1,
        statements: 93.19,
      },
    },
    environment: "node",
  },
});
