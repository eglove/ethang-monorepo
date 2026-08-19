/// <reference types="@cloudflare/vitest-pool-workers/types" />
import type { D1Migration } from "@cloudflare/vitest-pool-workers";

declare module "cloudflare:test" {
	interface ProvidedEnv extends Env {}
}

declare module "vitest" {
	interface ProvidedContext {
		migrations: D1Migration[];
	}
}
