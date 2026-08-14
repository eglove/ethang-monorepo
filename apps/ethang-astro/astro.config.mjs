import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig, fontProviders } from "astro/config";

const SITE = "https://ethang.dev";

// The Cloudflare adapter registers a worker Vite environment that conflicts
// with Vitest's SSR environment. Tests render components through the Astro
// container API, which does not need the adapter, so skip it under the test
// flag set by vitest.config.ts.
const isTest = "1" === process.env.ASTRO_TEST;

// https://astro.build/config
export default defineConfig({
	// eslint-disable-next-line no-undefined
	adapter: isTest ? undefined : cloudflare(),
	fonts: [
		{
			cssVariable: "--font-inter",
			name: "Inter",
			provider: fontProviders.fontsource(),
		},
		{
			cssVariable: "--font-jetbrains-mono",
			name: "JetBrains Mono",
			provider: fontProviders.fontsource(),
		},
	],
	image: {},
	integrations: [mdx(), ...(isTest ? [] : [sitemap()])],
	markdown: { shikiConfig: { theme: "night-owl" } },

	site: SITE,
	vite: {
		plugins: [tailwindcss()],
	},
});
