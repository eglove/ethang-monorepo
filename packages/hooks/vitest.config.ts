import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {

      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 12.65,
        functions: 17.92,
        lines: 20.75,
        statements: 20.75,
      },
    },
    environment: "jsdom",
  },
});
