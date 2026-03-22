import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        autoUpdate: true,
        branches: 61.22,
        functions: 72.97,
        lines: 74.92,
        statements: 73.76,
      },
    },
    include: ["src/**/*.test.ts"],
  },
});
