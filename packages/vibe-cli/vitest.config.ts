import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["graph/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 75.35,
        functions: 85.41,
        lines: 87.37,
        statements: 86.31,
      },
    },
    environment: "node",
  },
});
