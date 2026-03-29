import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 72.28,
        functions: 91.93,
        lines: 89.3,
        statements: 88.76,
      },
    },
    include: ["src/**/*.test.ts"],
  },
});
