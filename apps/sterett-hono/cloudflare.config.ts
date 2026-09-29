import { bindings, defineConfig } from "cf/config";

/**
 * Secret-like files were detected but not read or migrated: .dev.vars. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

export default defineConfig({
	worker: {
		name: "sterett-hono",
		compatibilityDate: "2026-09-21",
		compatibilityFlags: [
			"nodejs_compat",
		],
		entrypoint: "src/index.tsx",
		placement: {
			mode: "smart",
		},
		observability: {
			enabled: true,
			headSamplingRate: 1,
		},
		domains: [
			"sterettcreekvillagetrustee.com",
			"www.sterettcreekvillagetrustee.com",
		],
		env: {
			ASSETS: bindings.assets(),
		},
	},
});
