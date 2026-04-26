import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 91.92,
        functions: 100,
        lines: 99.75,
        statements: 99.31,
      },
    },
    include: ["src/**/*.test.ts"],
  },
});
