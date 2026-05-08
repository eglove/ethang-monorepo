import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      thresholds: {
        autoUpdate: true,
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0
      }
    },
    environment: "node"
  }
});
