import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "src/**/*.test.ts",
        "src/compile.ts",
        "src/content/**",
        "src/hooks/lessons-worker.ts",
        "src/hooks/pre-invocation.ts",
        "src/hooks/stop.ts"
      ],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 91.89,
        functions: 93.75,
        lines: 96.38,
        statements: 96.38
      }
    },
    environment: "node"
  }
});
