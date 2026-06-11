import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 2.53,
        functions: 13.2,
        lines: 12.89,
        statements: 12.89,
      },
    },
    environment: "jsdom",
  },
});
