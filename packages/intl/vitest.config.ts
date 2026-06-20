import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/en/http.ts", "src/en/index.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 100,
        lines: 100,
        functions: 100,
        statements: 100,
      }
    },
    include: ["src/**/*.test.ts"],
  },
});
