import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 94.54,
        functions: 87.5,
        lines: 92.24,
        statements: 92.36,
      },
    },
    environment: "node",
  },
});
