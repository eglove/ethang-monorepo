/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}

declare module "*.astro" {
	import type { AstroComponentFactory } from "astro/runtime/server/index.js";
	const Component: AstroComponentFactory;
	export default Component;
}
