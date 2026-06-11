import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 71.42,
        functions: 85.71,
        lines: 87.5,
        statements: 87.5,
      },
    },
    environment: "jsdom",
  },
});
