import isNil from "lodash/isNil.js";
import repeat from "lodash/repeat.js";
import { describe, expect, it } from "vitest";

import { canonicalUrl, excerptFromMarkdown, imageUrl } from "./seo.ts";

const SITE = "https://ethang.dev";
const BLOG_X = "/blog/x";
const BLOG_X_URL = `${SITE}${BLOG_X}`;
const SITE_URL = new URL(SITE);

describe("excerptFromMarkdown", () => {
  it.each([
    {
      expected: "",
      input: "",
      name: "empty string yields an empty excerpt"
    },
    {
      expected: "Hello world",
      input: "Hello world",
      name: "short plain text is unchanged"
    },
    {
      expected:
        "Note that the excerpt helper strips markdown noise such as frontmatter, imports, code fences, images, links, headings, lists, blockquotes, inline…",
      input:
        "Note that the excerpt helper strips markdown noise such as frontmatter, imports, code fences, images, links, headings, lists, blockquotes, inline formatting and HTML tags before collapsing whitespace",
      name: "long text is truncated at a word boundary"
    },
    {
      expected:
        "supercalifragilisticsupercalifragilisticsupercalifragilisticsupercalifragilisticsupercalifragilisticsupercalifragilisticsupercalifragilisticsupercalifragil…",
      input: repeat("supercalifragilistic", 8),
      name: "a single over-long word is hard cut"
    },
    {
      expected: "Title Sub Plain text",
      input: "# Title\n## Sub\nPlain text",
      name: "heading markers are stripped"
    },
    {
      expected: "item one item two item three",
      input: "* item one\n- item two\n+ item three",
      name: "unordered list markers are stripped"
    },
    {
      expected: "first second",
      input: "1. first\n2. second",
      name: "ordered list markers are stripped"
    },
    {
      expected: "quoted line second quote",
      input: "> quoted line\n> second quote",
      name: "blockquote markers are stripped"
    },
    {
      expected: "and link text",
      input: "![alt text](/img.png) and [link text](/blog/x)",
      name: "images are dropped while link text is kept"
    },
    {
      expected: "before after",
      input: "before ```js\ncode here\n``` after",
      name: "fenced code blocks are removed"
    },
    {
      expected: "code bold em strike",
      input: "`code` **bold** _em_ ~strike~",
      name: "inline formatting is flattened"
    },
    {
      expected: "Hello and bold",
      input: "<div>Hello</div> and <b>bold</b>",
      name: "raw HTML tags are removed"
    },
    {
      expected: "Real content",
      input: 'import X from "a.mjs"\nimport { Y } from "b.mjs"\nReal content',
      name: "import lines are dropped"
    },
    {
      expected: "Body text",
      input: "---\ntitle: Hi\ntags: [x]\n---\nBody text",
      name: "frontmatter is dropped"
    },
    {
      expected: "a b c",
      input: "  a   \t  b\n\n\n  c  ",
      name: "whitespace is collapsed to single spaces"
    },
    {
      expected: "aaa bbbb…",
      input: "aaa bbbb ccccc ddddd",
      maxLength: 10,
      name: "words are not cut mid-word when a boundary exists"
    }
  ])("$name", ({ expected, input, maxLength }) => {
    expect(
      isNil(maxLength)
        ? excerptFromMarkdown(input)
        : excerptFromMarkdown(input, maxLength)
    ).toBe(expected);
  });
});

describe("canonicalUrl", () => {
  it.each([
    {
      expected: BLOG_X_URL,
      name: "joins a pathname onto the site",
      pathname: BLOG_X,
      site: SITE
    },
    {
      expected: "https://ethang.dev/blog/x?page=2",
      name: "preserves a query string",
      pathname: "/blog/x?page=2",
      site: SITE
    },
    {
      expected: BLOG_X_URL,
      name: "accepts a URL object for the site",
      pathname: BLOG_X,
      site: SITE_URL
    },
    {
      expected: BLOG_X_URL,
      name: "handles a trailing-slash site",
      pathname: BLOG_X,
      site: `${SITE}/`
    }
  ])("$name", ({ expected, pathname, site }) => {
    expect(canonicalUrl(pathname, site)).toBe(expected);
  });
});

describe("imageUrl", () => {
  it.each([
    {
      expected: "https://ethang.dev/_astro/a.jpg",
      name: "joins an astro asset url onto the site",
      site: SITE,
      src: "/_astro/a.jpg"
    },
    {
      expected: "https://ethang.dev/_astro/a.jpg",
      name: "accepts a URL object for the site",
      site: SITE_URL,
      src: "/_astro/a.jpg"
    }
  ])("$name", ({ expected, site, src }) => {
    expect(imageUrl(src, site)).toBe(expected);
  });
});
