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
        functions: 93.2,
        lines: 94.84,
        statements: 94.84
      }
    },
    environment: "jsdom",
    globals: true
  }
});
