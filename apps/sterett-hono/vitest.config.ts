import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 92.02,
        functions: 100,
        lines: 99.76,
        statements: 99.31
      }
    },
    include: ["src/**/*.test.ts"]
  }
});
