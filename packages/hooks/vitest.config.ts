import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 11.39,
        functions: 15.09,
        lines: 16.03,
        statements: 16.03,
      },
    },
    environment: "jsdom",
  },
});
