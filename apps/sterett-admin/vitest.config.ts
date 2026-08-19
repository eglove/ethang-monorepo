import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["dashboard/time-display.tsx", "schemas/news-update.ts"],
      provider: "istanbul",
      reporter: ["text", "json-summary", "html", "lcov"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    environment: "jsdom"
  }
});
