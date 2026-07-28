import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      exclude: ["src/clients/apollo.ts"],
      include: ["src", "worker"],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    environment: "jsdom",
    globals: true
  }
});
