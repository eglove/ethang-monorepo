import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 25.31,
        functions: 30.18,
        lines: 31.13,
        statements: 31.13,
      },
    },
    environment: "jsdom",
  },
});
