import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/use-map.ts", "src/use-window-size.ts", "src/use-boolean.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 66.66,
        functions: 100,
        lines: 97.43,
        statements: 97.43,
      },
    },
    environment: "jsdom",
  },
});
