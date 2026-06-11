import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 1.26,
        functions: 4.71,
        lines: 4.37,
        statements: 4.37,
      },
    },
    environment: "jsdom",
  },
});
