import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 34.17,
        functions: 16.98,
        lines: 20.75,
        statements: 20.75,
      },
    },
    environment: "jsdom",
  },
});
