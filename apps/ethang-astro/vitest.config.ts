import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			include: [
				"scripts/lib/portableTextToMdx.ts",
				"src/lib/blog-pagination.ts",
				"src/lib/image.ts",
				"src/lib/login.ts",
				"src/lib/rss.ts",
				"src/lib/session.ts",
				"src/lib/ui.ts",
			],
			provider: "v8",
			reporter: ["text", "json-summary", "html", "lcov"],
			thresholds: {
				branches: 100,
				functions: 100,
				lines: 100,
				statements: 100,
			},
		},
		environment: "node",
		include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
	},
});
