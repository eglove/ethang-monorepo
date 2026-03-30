import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/scripts/**", "src/**/*.client.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
