import cloudflare from "@astrojs/cloudflare";
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import remarkMath from "remark-math";

const SITE = "https://ethang.dev";

/**
Walks a hast tree and opens every absolute http(s) link in a new tab.
Relative and anchor links stay in the same tab. Member types are declared
inline because the app does not depend on @types/hast; only `a` elements
reach the properties access, and hast elements always carry properties.

@param {object} node
@param {string} [node.type]
@param {string} [node.tagName]
@param {Record<string, unknown>} node.properties
@param {Array<object>} [node.children]
*/
const openExternalLinksInNewTab = (node) => {
  if (
    "element" === node.type &&
    "a" === node.tagName &&
    /^https?:/iu.test(String(node.properties.href))
  ) {
    node.properties.target = "_blank";
    node.properties.rel = "noopener noreferrer";
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      openExternalLinksInNewTab(child);
    }
  }
};

/*
 * Unified calls a plugin once to produce its transformer, so the walker is
 * wrapped in an attacher. Runs over every markdown and MDX document.
 */
const externalLinksNewTab = () => {
  return openExternalLinksInNewTab;
};

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
      provider: fontProviders.fontsource()
    },
    {
      cssVariable: "--font-jetbrains-mono",
      name: "JetBrains Mono",
      provider: fontProviders.fontsource()
    }
  ],
  image: {},
  integrations: [mdx(), ...(isTest ? [] : [sitemap()])],
  markdown: {
    /*
     * Math and diagrams render at build time: KaTeX emits HTML in the rehype
     * step, and rehype-mermaid replaces ```mermaid fences with inline SVGs
     * (strategy "inline-svg"), so neither costs client-side JavaScript. The
     * dark mermaid theme matches the Night Owl palette; diagram rendering
     * needs a Playwright Chromium install (`npx playwright install chromium`).
     */
    processor: unified({
      rehypePlugins: [
        [rehypeMermaid, { mermaidConfig: { theme: "dark" } }],
        rehypeKatex,
        externalLinksNewTab
      ],
      remarkPlugins: [remarkMath]
    }),
    shikiConfig: { theme: "night-owl" },
    // Astro highlights fences before user rehype plugins run, so mermaid must
    // be excluded or rehype-mermaid never sees the language-mermaid class.
    syntaxHighlight: { excludeLangs: ["mermaid"], type: "shiki" }
  },
  site: SITE,
  vite: {
    plugins: [tailwindcss()]
  }
});
