import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*"],
      provider: "v8",
      reporter: ["text", "html", "json-summary"]
    },
    globals: false
  }
});
