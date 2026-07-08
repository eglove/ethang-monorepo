import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      exclude: ["src/clients/apollo.ts"],
      include: ["src", "worker"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 97.3,
        functions: 92.96,
        lines: 94.67,
        statements: 94.67
      }
    },
    environment: "jsdom",
    globals: true
  }
});
