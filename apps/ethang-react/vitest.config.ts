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
        branches: 75.13,
        functions: 58.53,
        lines: 65.2,
        statements: 65.2
      }
    },
    environment: "jsdom",
    globals: true
  }
});
