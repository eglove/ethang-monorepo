import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 10.12,
        functions: 15.09,
        lines: 16.56,
        statements: 16.56,
      },
    },
    environment: "jsdom",
  },
});
