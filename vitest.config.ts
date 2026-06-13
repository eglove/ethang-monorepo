import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["**/src/**/*.ts", "**/src/**/*.tsx"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 69.14,
        functions: 66.27,
        lines: 72.91,
        statements: 72.94
      }
    },
    projects: [
      "apps/*/vitest.config.{ts,mts}",
      "packages/*/vitest.config.ts",
      {
        test: {
          environment: "node",
          include: ["vitest.config.test.ts"],
          name: "root-tests"
        }
      }
    ]
  }
});
