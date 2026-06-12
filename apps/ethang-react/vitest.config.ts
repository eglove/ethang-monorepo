import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      include: ["src", "worker"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 48.38,
        functions: 39.47,
        lines: 47.29,
        statements: 47.29
      }
    },
    environment: "jsdom",
    globals: true
  }
});
