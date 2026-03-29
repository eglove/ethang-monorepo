import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 64.45,
        functions: 82.25,
        lines: 81.34,
        statements: 80.27,
      },
    },
    include: ["src/**/*.test.ts"],
  },
});
