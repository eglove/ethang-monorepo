import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 35.44,
        functions: 50,
        lines: 52.14,
        statements: 52.14,
      },
    },
    environment: "jsdom",
  },
});
