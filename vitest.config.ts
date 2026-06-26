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
        "**/.wrangler/**",
        "**/build.ts"
      ],
      include: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 94.76,
        functions: 92.26,
        lines: 96.33,
        statements: 96.31
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
