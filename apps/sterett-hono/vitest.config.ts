import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 95.06,
        functions: 100,
        lines: 99.77,
        statements: 99.56
      }
    },
    include: ["src/**/*.test.ts"]
  }
});
