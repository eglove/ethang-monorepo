import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["util/*", "schema-types/*"],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      thresholds: {
        branches: 80,
        functions: 96,
        lines: 98.07,
        statements: 98.07
      }
    },
    environment: "node"
  }
});
