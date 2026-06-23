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
        branches: 91.73,
        functions: 83.53,
        lines: 87.89,
        statements: 87.89
      }
    },
    environment: "jsdom",
    globals: true
  }
});
