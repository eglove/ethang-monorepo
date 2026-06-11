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
        branches: 48.27,
        functions: 38.18,
        lines: 45.75,
        statements: 45.75
      }
    },
    environment: "jsdom",
    globals: true
  }
});
