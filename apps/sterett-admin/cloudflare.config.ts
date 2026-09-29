import { bindings, defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "sterett-admin",
		compatibilityDate: "2026-09-21",
		entrypoint: "src/index.ts",
		observability: {
			enabled: true,
			headSamplingRate: 1,
		},
		domains: [
			"admin.sterettcreekvillagetrustee.com",
		],
		env: {
			ASSETS: bindings.assets(),
		},
	},
});
