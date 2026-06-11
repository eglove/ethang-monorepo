import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      // Keep it disabled for now as other hooks might not have tests, but it will measure correctly
    },
    environment: "jsdom",
  },
});
