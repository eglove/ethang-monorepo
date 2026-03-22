import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        autoUpdate: true,
        branches: 47.14,
        functions: 36.06,
        lines: 47.27,
        statements: 49.36,
      },
    },
    include: ["src/**/*.test.ts"],
  },
});
