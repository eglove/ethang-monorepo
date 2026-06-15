import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 94.49,
        functions: 87.35,
        lines: 94.26,
        statements: 94.39
      }
    },
    environment: "node"
  }
});
