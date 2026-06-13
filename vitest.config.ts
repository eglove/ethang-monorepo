import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["**/src/**/*.ts", "**/src/**/*.tsx"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 68.02,
        functions: 66.82,
        lines: 73.12,
        statements: 73.14
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
