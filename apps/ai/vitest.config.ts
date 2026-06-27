import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src"],
      provider: "v8",
      thresholds: {
        autoUpdate: true,
        branches: 5.66,
        functions: 11.11,
        lines: 22.98,
        statements: 23.2
      }
    },
    env: {
      OPENROUTER_API_KEY: "test-key",
      OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
      OPENROUTER_MODEL: "openrouter/owl-alpha"
    }
  }
});
