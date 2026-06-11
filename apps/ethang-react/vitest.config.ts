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
        branches: 47.82,
        functions: 39.28,
        lines: 47.54,
        statements: 47.54
      }
    },
    environment: "jsdom",
    globals: true
  }
});
