import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 32.91,
        functions: 12.26,
        lines: 17.5,
        statements: 17.5,
      },
    },
    environment: "jsdom",
  },
});
