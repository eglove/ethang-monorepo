import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src"],
      provider: "v8",
      thresholds: {
        autoUpdate: true,
        branches: 94.08,
        functions: 100,
        lines: 100,
        statements: 98.68
      }
    },
    env: {
      OPENROUTER_API_KEY: "test-key",
      OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
      OPENROUTER_MODEL: "openrouter/owl-alpha"
    }
  }
});
