import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/*.bench.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 94.49,
        functions: 100,
        lines: 97.73,
        statements: 97.78
      }
    },
    environment: "node"
  }
});
