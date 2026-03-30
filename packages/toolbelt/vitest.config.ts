import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 92.92,
        functions: 93.93,
        lines: 95.42,
        statements: 95.42,
      },
    },
    environment: "node",
  },
});
