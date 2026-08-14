import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			exclude: [
				"**/service-worker/**",
				"**/.agents/**",
				".junie/**",
				"*.d.ts",
				"*.bench.ts",
				"*.gen.ts",
				"*.config.ts",
				"*.fixture.ts",
				"**/.wrangler/**",
				"**/build.ts",
				"apps/sterett-admin",
				"packages/intl/src/en/http.ts",
				"packages/intl/src/en/index.ts",
				"packages/eslint-plugin/src/**/*.test.ts",
				"packages/eslint-plugin/src/index.test.ts",
				"packages/agents-build/src/**/*.test.ts",
				"packages/agents-build/src/content/**",
				"apps/ethang-rss/**/*.mock.ts",
				"apps/ethang-rss/src/db/database-schema.ts",
				"**/test-utilities/**",
			],
			include: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
			provider: "v8",
			reporter: ["text", "json-summary", "html", "lcov"],
			thresholds: {
				branches: 80,
				functions: 80,
				lines: 80,
				statements: 80,
			},
		},
		projects: [
			"apps/*/vitest.config.{ts,mts}",
			"packages/*/vitest.config.ts",
			{
				test: {
					environment: "node",
					include: ["vitest.config.test.ts"],
					name: "root-tests",
				},
			},
		],
	},
});
