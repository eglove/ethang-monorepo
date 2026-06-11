import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 94.19,
        functions: 94.02,
        lines: 95.73,
        statements: 95.73,
      },
    },
    environment: "node",
    setupFiles: ["src/test-setup.ts"],
  },
});
