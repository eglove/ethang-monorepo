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
        "**/.wrangler/**",
        "**/build.ts",
        "apps/sterett-admin",
        "apps/ethang-admin"
      ],
      include: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 95.98,
        functions: 98.13,
        lines: 98.87,
        statements: 98.86
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
