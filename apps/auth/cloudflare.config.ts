import { bindings, defineConfig } from "cf/config";

/**
 * Secret-like files were detected but not read or migrated: .dev.vars, .env. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

export default defineConfig({
	worker: {
		name: "auth",
		compatibilityDate: "2026-09-21",
		compatibilityFlags: [
			"experimental",
			"nodejs_compat",
		],
		entrypoint: "src/index.ts",
		placement: {
			mode: "smart",
		},
		observability: {
			enabled: true,
			headSamplingRate: 1,
		},
		domains: [
			"auth.ethang.dev",
		],
		env: {
			"token-auth": bindings.secret(),
			DB: bindings.d1({
				name: "auth",
				id: "9d0cf181-4713-4ca6-bb2f-49a9d997449b",
			}),
		},
	},
});
