import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatDate: "2026-08-14",
        compatFlags: ["nodejs_compat"],
        d1Databases: ["jobApplications"],
        r2Buckets: ["jobResumes"]
      }
    })
  ],
  test: {
    coverage: {
      exclude: ["src/**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 }
    },
    include: ["src/**/*.test.ts"]
  }
});
