/// <reference types="vitest/config" />
process.env["ASTRO_TEST"] = "1";

import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    coverage: {
      exclude: [
        "*.config.ts",
        "*.config.mjs",
        "**/*.test.ts",
        "**/*.d.ts",
        "src/env.d.ts",
        // Browser-only client bootstrap; exercised by `astro build`, not vitest.
        "src/pwa.ts"
      ],
      include: ["src/**/*.{ts,astro}", "constants/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    environment: "node",
    include: ["src/**/*.test.ts", "constants/**/*.test.ts"],
    server: {
      deps: {
        inline: ["lucide-astro"]
      }
    }
  }
});
