import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/use-set.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
    },
    environment: "jsdom",
  },
});
