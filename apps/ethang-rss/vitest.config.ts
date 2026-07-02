import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/*.mock.ts", "src/db/database-schema.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 99.62,
        functions: 100,
        lines: 99.76,
        statements: 99.76
      }
    },
    environment: "node"
  }
});
