import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 25.97,
        functions: 32.07,
        lines: 28.7,
        statements: 28.7,
      },
    },
    environment: "jsdom",
  },
});
