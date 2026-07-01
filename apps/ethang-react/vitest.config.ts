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
        branches: 94.75,
        functions: 91.77,
        lines: 94.17,
        statements: 94.17
      }
    },
    environment: "jsdom",
    globals: true
  }
});
