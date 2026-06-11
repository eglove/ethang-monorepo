import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 21.51,
        functions: 23.58,
        lines: 23.27,
        statements: 23.27,
      },
    },
    environment: "jsdom",
  },
});
