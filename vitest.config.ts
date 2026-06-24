import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/service-worker/**", "**/.agents/**", ".junie/**"],
      include: ["**/src/**/*.ts", "**/src/**/*.tsx", "packages/scripts/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 96.57,
        functions: 94.97,
        lines: 97.12,
        statements: 97.09
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
