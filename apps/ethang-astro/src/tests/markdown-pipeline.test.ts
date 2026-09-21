import {
  isUnifiedProcessor,
  markdownConfigDefaults,
  rehypeShiki
} from "@astrojs/markdown-remark";
import first from "lodash/first.js";
import flow from "lodash/flow.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";
import overSome from "lodash/overSome.js";
import reject from "lodash/reject.js";
import { readFile } from "node:fs/promises";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type Pluggable, unified } from "unified";
import { describe, expect, it } from "vitest";

import astroConfig from "../../astro.config.mjs";

const markdownOptions = astroConfig.markdown;
const processor = markdownOptions?.processor;

if (processor === undefined || !isUnifiedProcessor(processor)) {
  throw new Error(
    "astro.config.mjs must set markdown.processor via unified() from @astrojs/markdown-remark"
  );
}

const syntaxHighlight = markdownOptions?.syntaxHighlight;

/*
 * Astro's config type also accepts string preset names, which unified cannot
 * load in ESM; this config only ever declares plugin functions/tuples.
 */
const isPresetName = overSome([isString, flow(first, isString)]);

const pluggableList = (plugins: readonly unknown[]) => {
  return reject(plugins, isPresetName) as Pluggable[];
};

const excludedLanguages = isObject(syntaxHighlight)
  ? (syntaxHighlight.excludeLangs ?? [])
  : [];

/*
 * Mirrors the order the unified processor applies markdown config: GFM, user
 * remark plugins, remark-rehype, syntax highlighting, then user rehype
 * plugins. The plugin lists come from the real astro.config.mjs processor so
 * a wiring regression fails here rather than in production.
 */
const renderMarkdown = async (markdown: string) => {
  return String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(pluggableList(processor.options.remarkPlugins))
      .use(remarkRehype)
      .use(
        rehypeShiki,
        markdownOptions?.shikiConfig ?? markdownConfigDefaults.shikiConfig,
        excludedLanguages
      )
      .use(pluggableList(processor.options.rehypePlugins))
      .use(rehypeStringify)
      .process(markdown)
  );
};

describe("markdown math pipeline", () => {
  it.each([
    {
      expected: "katex-display",
      markdown: "$$\n\\int_0^1 x^2 \\,dx = \\frac{1}{3}\n$$\n",
      name: "display math"
    },
    {
      expected: "katex",
      markdown: "Inline $E = mc^2$ math.",
      name: "inline math"
    }
  ])("renders $name as KaTeX HTML", async ({ expected, markdown }) => {
    const html = await renderMarkdown(markdown);

    expect(html).toContain(expected);
    expect(html).toContain("katex-html");
  });

  it.each([
    { markdown: "It costs $5 today.", name: "lone currency dollar" },
    {
      markdown: String.raw`Escaped \$5 stays literal.`,
      name: "escaped dollar"
    },
    { markdown: "No math here at all.", name: "plain text" }
  ])("leaves $name as literal text", async ({ markdown }) => {
    const html = await renderMarkdown(markdown);

    expect(html).not.toContain("katex");
  });

  /*
   * Paired dollars are always math, even across a space — authors escape a
   * literal price with a backslash.
   */
  it("renders text between paired currency dollars as math", async () => {
    const html = await renderMarkdown("Prices: $5 and $10.");

    expect(html).toContain("katex");
  });
});

describe("markdown mermaid pipeline", () => {
  it(
    "renders a fenced mermaid diagram as an inline SVG",
    { timeout: 120_000 },
    async () => {
      const html = await renderMarkdown(
        "```mermaid\ngraph TD\n  A[Request] --> B[Response]\n```"
      );

      expect(html).toContain("<svg");
      expect(html).toContain("Request");
      expect(html).not.toContain("language-mermaid");
    }
  );

  it("shiki-highlights fenced code in other languages", async () => {
    const html = await renderMarkdown("```js\nconst answer = 42;\n```");

    expect(html).toContain("astro-code");
    expect(html).toContain('data-language="js"');
    expect(html).not.toContain("<svg");
  });
});

describe("KaTeX stylesheet", () => {
  it("ships the KaTeX stylesheet from the base layout", async () => {
    const [stylesheet, layout] = await Promise.all([
      readFile(
        new URL(import.meta.resolve("katex/dist/katex.min.css")),
        "utf8"
      ),
      readFile(new URL("../layouts/BaseLayout.astro", import.meta.url), "utf8")
    ]);

    expect(stylesheet).toContain(".katex");
    expect(layout).toContain('import "katex/dist/katex.min.css"');
  });
});
