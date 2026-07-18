import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "**/service-worker/**",
        "**/.agents/**",
        ".junie/**",
        "*.d.ts",
        "*.bench.ts",
        "*.gen.ts",
        "*.config.ts",
        "*.fixture.ts",
        "**/.wrangler/**",
        "**/build.ts",
        "apps/sterett-admin",
        "apps/ethang-admin",
        "packages/intl/src/en/http.ts",
        "packages/intl/src/en/index.ts",
        "packages/eslint-plugin/src/**/*.test.ts",
        "packages/eslint-plugin/src/index.test.ts",
        "packages/agents-build/src/**/*.test.ts",
        "packages/agents-build/src/content/**",
        "packages/monorepo-tools/src/cli/run-workspace.worker.ts",
        "apps/ethang-react/src/clients/apollo.ts",
        "apps/ethang-rss/**/*.mock.ts",
        "apps/ethang-rss/src/db/database-schema.ts",
        "**/test-utilities/**",
        "packages/monorepo-tools/tests/**"
      ],
      include: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100
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
