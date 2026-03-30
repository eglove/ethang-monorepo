import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 86.82,
        functions: 96.77,
        lines: 98.75,
        statements: 98.16,
      },
    },
    include: ["src/**/*.test.ts"],
  },
});
