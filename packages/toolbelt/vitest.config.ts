import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 94.34,
        functions: 94.02,
        lines: 95.82,
        statements: 95.82,
      },
    },
    environment: "node",
    setupFiles: ["src/test-setup.ts"],
  },
});
