import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        autoUpdate: true,
        branches: 55.55,
        functions: 56.16,
        lines: 65.12,
        statements: 65.25,
      },
    },
    include: ["src/**/*.test.ts"],
  },
});
