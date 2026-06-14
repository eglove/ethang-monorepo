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
        branches: 48.96,
        functions: 39.47,
        lines: 48.05,
        statements: 48.05
      }
    },
    environment: "jsdom",
    globals: true
  }
});
