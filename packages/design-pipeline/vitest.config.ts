import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "src/index.ts",
        "src/contracts/hono-writer.ts",
        "src/contracts/typescript-writer.ts",
        "src/contracts/ui-writer.ts",
        "src/contracts/trainer-input.ts",
      ],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    environment: "node",
  },
});
