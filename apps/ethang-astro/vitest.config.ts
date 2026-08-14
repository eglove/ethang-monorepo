/// <reference types="vitest/config" />
process.env["ASTRO_TEST"] = "1";

import { getViteConfig } from "astro/config";

export default getViteConfig({
	test: {
		coverage: {
			exclude: [
				"**/*.test.ts",
				"**/*.d.ts",
				"src/content.config.ts",
				"src/env.d.ts",
				"scripts/fetch-featured-images.ts",
			],
			include: ["src/**/*.{ts,astro}", "constants/**/*.ts", "scripts/**/*.ts"],
			provider: "v8",
			reporter: ["text", "json-summary", "html", "lcov"],
			thresholds: {
				branches: 80,
				functions: 80,
				lines: 80,
				statements: 80,
			},
		},
		environment: "node",
		include: [
			"src/**/*.test.ts",
			"constants/**/*.test.ts",
			"scripts/**/*.test.ts",
		],
	},
});
