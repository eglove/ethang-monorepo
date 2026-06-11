import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      include: [
        "src/components/auth/auth-store.ts",
        "src/routes/login.tsx",
        "src/components/layout/main-layout.tsx"
      ],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100
      }
    },
    environment: "jsdom",
    globals: true
  }
});
