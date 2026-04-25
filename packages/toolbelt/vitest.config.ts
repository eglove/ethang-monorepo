import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 93.04,
        functions: 94.02,
        lines: 95.53,
        statements: 95.53,
      },
    },
    environment: "node",
    setupFiles: ["src/test-setup.ts"],
  },
});
