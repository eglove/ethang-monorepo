import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 95.68,
        functions: 100,
        lines: 99.7,
        statements: 99.7
      }
    },
    environment: "node",
    setupFiles: ["src/test-setup.ts"]
  }
});
