import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 87.42,
        functions: 96.85,
        lines: 98.79,
        statements: 98.21,
      },
    },
    include: ["src/**/*.test.ts"],
  },
});
