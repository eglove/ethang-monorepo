import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    exclude: ["node_modules", "**/*.spec.ts"],
    globals: true,
    include: ["src/**/*.test.ts"]
  }
});
