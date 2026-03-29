import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/scripts/**", "src/**/*.client.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        autoUpdate: true,
        branches: 97.58,
        functions: 99.05,
        lines: 99.77,
        statements: 99.77,
      },
    },
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
