import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "sanity-calendar-sync",
		compatibilityDate: "2026-09-21",
		entrypoint: "src/index.ts",
		placement: {
			mode: "smart",
		},
		observability: {
			enabled: true,
			headSamplingRate: 1,
		},
	},
});
