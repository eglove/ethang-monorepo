import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 96.36,
        functions: 96.87,
        lines: 96.99,
        statements: 96.99,
      },
    },
    environment: "jsdom",
  },
});
