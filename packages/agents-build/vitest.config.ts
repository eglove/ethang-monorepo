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
        branches: 95,
        functions: 100,
        lines: 100,
        statements: 100
      }
    },
    environment: "node"
  }
});
