import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 6.32,
        functions: 3.77,
        lines: 3.43,
        statements: 3.43,
      },
    },
    environment: "jsdom",
  },
});
