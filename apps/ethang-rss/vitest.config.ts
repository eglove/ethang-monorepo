import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/*.mock.ts", "src/db/database-schema.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 99.33,
        functions: 100,
        lines: 99.81,
        statements: 99.81
      }
    },
    environment: "node"
  }
});
