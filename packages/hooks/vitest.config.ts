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
        functions: 10.37,
        lines: 12.81,
        statements: 12.81,
      },
    },
    environment: "jsdom",
  },
});
