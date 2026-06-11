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
        branches: 45.45,
        functions: 35.45,
        lines: 43.39,
        statements: 43.39
      }
    },
    environment: "jsdom",
    globals: true
  }
});
