import cloudflare from "@astrojs/cloudflare";
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import isNil from "lodash/isNil.js";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import remarkMath from "remark-math";

const SITE = "https://ethang.dev";

/**
@typedef {object} MarkdownNode
@property {string} [type]
@property {string} [value]
@property {{start?: {offset?: number}, end?: {offset?: number}}} [position]
@property {MarkdownNode[]} [children]
@property {object} [data]
*/

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

/**
MDX's micromark extensions skip the math flow construct, so `$$...$$` blocks
parse as text-level math inside a paragraph and rehype-katex renders them
inline. Upgrades any `$$`-delimited text math node in place to the
`pre > code.language-math.math-display` shape mdast-util-math emits on the
markdown path, which rehype-katex renders as display math.

@param {MarkdownNode} node
@param {{value: string}} file
*/
const upgradeDisplayMathNode = (node, file) => {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;
  if (isNil(start) || isNil(end)) {
    return;
  }
  const raw = file.value.slice(start, end);
  if (!raw.startsWith("$$")) {
    return;
  }
  /*
   * Replace the data wholesale: remark-math already set `hProperties` with
   * the `math-inline` class here, and applyData() merges stale `hProperties`
   * onto the upgraded element, which would keep rendering the math inline.
   */
  node.data = {
    hChildren: [
      {
        children: [{ type: "text", value: node.value }],
        properties: { className: ["language-math", "math-display"] },
        tagName: "code",
        type: "element"
      }
    ],
    hName: "pre"
  };
};

/**
@param {MarkdownNode} node
@param {{value: string}} file
*/
const upgradeDisplayMathWalk = (node, file) => {
  if (isNil(node.children)) {
    return;
  }
  for (const child of node.children) {
    if ("inlineMath" === child.type) {
      upgradeDisplayMathNode(child, file);
    } else {
      upgradeDisplayMathWalk(child, file);
    }
  }
};

/*
 * Unified calls a plugin once to produce its transformer, so the walker is
 * wrapped in an attacher. Runs over every markdown and MDX document.
 */
const upgradeDisplayMath = () => {
  return upgradeDisplayMathWalk;
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
     *
     * htmlLabels must stay off: HTML labels are measured with the build
     * browser's fonts but re-rendered with the viewer's, and any metric
     * difference clips the last label line inside the fixed-size
     * foreignObject. SVG text labels cannot reflow, so multi-line labels
     * use explicit <br/> breaks in the diagram source instead.
     */
    processor: unified({
      rehypePlugins: [
        [
          rehypeMermaid,
          {
            mermaidConfig: {
              htmlLabels: false,
              theme: "dark"
            }
          }
        ],
        rehypeKatex,
        externalLinksNewTab
      ],
      remarkPlugins: [remarkMath, upgradeDisplayMath]
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
