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
        functions: 20.75,
        lines: 26.1,
        statements: 26.1,
      },
    },
    environment: "jsdom",
  },
});
