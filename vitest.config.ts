import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/service-worker/**"],
      include: ["**/src/**/*.ts", "**/src/**/*.tsx"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 75.26,
        functions: 70.39,
        lines: 77.36,
        statements: 77.35
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
