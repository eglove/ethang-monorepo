import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src"],
      provider: "v8",
      thresholds: {
        autoUpdate: true,
        branches: 93.6,
        functions: 99.14,
        lines: 99.46,
        statements: 98.18
      }
    },
    env: {
      OPENROUTER_API_KEY: "test-key",
      OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
      OPENROUTER_MODEL: "openrouter/owl-alpha"
    }
  }
});
