import mdx from "@astrojs/mdx";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig, fontProviders } from "astro/config";

const SITE = "https://ethang.dev";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  fonts: [
    {
      cssVariable: "--font-inter",
      name: "Inter",
      provider: fontProviders.fontsource()
    },
    {
      cssVariable: "--font-jetbrains-mono",
      name: "JetBrains Mono",
      provider: fontProviders.fontsource()
    }
  ],
  image: {},
  integrations: [mdx(), sitemap()],
  site: SITE,

  vite: {
    plugins: [tailwindcss()]
  },
  markdown: { shikiConfig: { theme: "night-owl" } }
});
