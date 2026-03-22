import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        autoUpdate: true,
        branches: 62.73,
        functions: 73.45,
        lines: 75.86,
        statements: 74.87,
      },
    },
    include: ["src/**/*.test.ts"],
  },
});
