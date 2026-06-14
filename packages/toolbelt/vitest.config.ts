import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 96.79,
        functions: 100,
        lines: 100,
        statements: 100
      }
    },
    environment: "node",
    setupFiles: ["src/test-setup.ts"]
  }
});
