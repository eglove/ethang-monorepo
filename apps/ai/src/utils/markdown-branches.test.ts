import { marked } from "marked";
import { describe, expect, it } from "vitest";

import { createNightOwlRenderer, renderMarkdown } from "./markdown.js";

const EXAMPLE_IMG_URL = "https://example.com/img.png";
const EXAMPLE_URL = "https://example.com";

describe("renderMarkdown branch coverage", () => {
  it("renders h5 and h6 headings (falls through to heading4 color)", () => {
    expect(renderMarkdown("##### H5")).toContain("H5");
    expect(renderMarkdown("###### H6")).toContain("H6");
  });

  it("renders images", () => {
    const result = renderMarkdown("![alt text](https://example.com/img.png)");
    expect(result).toContain("alt text");
    expect(result).toContain(EXAMPLE_IMG_URL);
  });

  it("renders strikethrough text", () => {
    const result = renderMarkdown("~~deleted~~");
    expect(result).toContain("deleted");
    expect(result).not.toContain("~~deleted~~");
  });

  it("renders checkboxes (checked and unchecked)", () => {
    const checked = renderMarkdown("- [x] done");
    const unchecked = renderMarkdown("- [ ] todo");
    expect(checked).toContain("[x]");
    expect(unchecked).toContain("[ ]");
  });

  it("renders ordered lists", () => {
    const result = renderMarkdown("1. first\n2. second");
    expect(result).toContain("first");
    expect(result).toContain("second");
  });

  it("renders nested inline tokens (text with tokens)", () => {
    const result = renderMarkdown("Hello **bold** world");
    expect(result).toContain("Hello");
    expect(result).toContain("bold");
    expect(result).toContain("world");
  });

  it("renders links with tokens inside", () => {
    const result = renderMarkdown("[click **here**](https://example.com)");
    expect(result).toContain("click");
    expect(result).toContain("here");
    expect(result).toContain(EXAMPLE_URL);
  });

  it("renders escape sequences", () => {
    const result = renderMarkdown(String.raw`\*not italic\*`);
    expect(result).toContain("*not italic*");
  });

  it("renders space tokens as newlines", () => {
    const result = renderMarkdown("paragraph one\n\nparagraph two");
    expect(result).toContain("paragraph one");
    expect(result).toContain("paragraph two");
  });

  it("renders blockquote tokens inline", () => {
    const result = renderMarkdown("> quoted\n> more");
    expect(result).toContain("quoted");
    expect(result).toContain("more");
  });

  it("renders list tokens inline", () => {
    const result = renderMarkdown("- item one\n- item two");
    expect(result).toContain("item one");
    expect(result).toContain("item two");
  });

  it("renders code blocks with multiple lines", () => {
    const result = renderMarkdown("```\nline1\nline2\nline3\n```");
    expect(result).toContain("line1");
    expect(result).toContain("line2");
    expect(result).toContain("line3");
  });

  it("renders headings at various depths", () => {
    expect(renderMarkdown("# H1")).toContain("H1");
    expect(renderMarkdown("## H2")).toContain("H2");
    expect(renderMarkdown("### H3")).toContain("H3");
    expect(renderMarkdown("#### H4")).toContain("H4");
  });

  it("renders complex mixed markdown covering many inline token types", () => {
    const input = `# Plan

## Introduction

This is a **bold** statement with \`inline code\` and *italic* and ~~strikethrough~~.

- Item 1
- Item 2

> A quote that is longer

\`\`\`
const x = 1;
const y = 2;
\`\`\`

Visit [the docs](https://example.com) for more.

![screenshot](https://example.com/img.png)

---

Some final text with a line break
and continuation.
`;
    const result = renderMarkdown(input);
    // Verify key content is present (renderer methods were exercised)
    expect(result).toContain("Plan");
    expect(result).toContain("bold");
    expect(result).toContain("inline code");
    expect(result).toContain("Item 1");
    expect(result).toContain("A quote");
    expect(result).toContain("the docs");
    expect(result).toContain("screenshot");
  });
});

describe("renderMarkdown edge cases", () => {
  it("renders image without alt text inside paragraph context", () => {
    // This exercises renderImage via inline tokens when image is in a paragraph
    const result = renderMarkdown(
      "See ![](https://example.com/img.png) for details."
    );
    expect(result).toContain("for details");
  });

  it("renders table with inline formatting in cells", () => {
    const result = renderMarkdown(
      "| Name | Description |\n|------|-------------|\n| **Bold** | `code` |"
    );
    expect(result).toContain("Bold");
    expect(result).toContain("code");
  });

  it("renders strikethrough with nested bold formatting", () => {
    const result = renderMarkdown("~~**bold strikethrough**~~");
    expect(result).toContain("bold strikethrough");
  });

  it("renders line break inside a paragraph with trailing spaces", () => {
    const result = renderMarkdown("First line  \nSecond line");
    expect(result).toContain("First line");
    expect(result).toContain("Second line");
  });

  it("strips complex HTML with attributes and nested tags", () => {
    const result = renderMarkdown(
      '<div class="test">content <a href="link">link text</a></div>'
    );
    expect(result).not.toContain("<div");
    expect(result).not.toContain("</div>");
    expect(result).toContain("content");
    expect(result).toContain("link text");
  });

  it("renders link with no inner tokens (plain text link)", () => {
    const result = renderMarkdown("[plain](https://example.com)");
    expect(result).toContain("plain");
    expect(result).toContain(EXAMPLE_URL);
  });

  it("renders nested list with sub-items", () => {
    const result = renderMarkdown("- Item 1\n  - Sub item\n- Item 2");
    expect(result).toContain("Item 1");
    expect(result).toContain("Sub item");
    expect(result).toContain("Item 2");
  });

  it("renders text with multiple inline elements in sequence", () => {
    const result = renderMarkdown(
      "**Bold**, *italic*, ~~strikethrough~~ and normal."
    );
    expect(result).toContain("Bold");
    expect(result).toContain("italic");
    expect(result).toContain("strikethrough");
    expect(result).toContain("normal");
  });

  it("renders checkbox both checked and unchecked in task list", () => {
    const result = renderMarkdown("- [x] checked task\n- [ ] unchecked task");
    expect(result).toContain("[x]");
    expect(result).toContain("[ ]");
  });

  it("renders strikethrough with nested formatting to exercise del tokens.length branch", () => {
    // Strikethrough with nested bold: tests 0 < tokens.length in del renderer
    const result = renderMarkdown("~~**bold inside strikethrough**~~");
    expect(result).toContain("bold inside strikethrough");
  });

  it("renders strikethrough without inner tokens (plain text) for the else branch", () => {
    // Plain strikethrough: tests the !(0 < tokens.length) path in del renderer
    const result = renderMarkdown("~~just strikethrough~~");
    expect(result).toContain("just strikethrough");
  });

  it("renders plain paragraphs with text-only content", () => {
    // Paragraph renderer calling renderInlineTokens with a simple text token
    const result = renderMarkdown("Just a simple paragraph.");
    expect(result).toContain("Just a simple paragraph.");
  });

  it("renders link with no inner tokens (plain text) to exercise link text fallback", () => {
    // Plain text link - tests the 0 < tokens.length branch in link renderer
    const result = renderMarkdown("[plain text link](https://example.com)");
    expect(result).toContain("plain text link");
    expect(result).toContain(EXAMPLE_URL);
  });

  it("renders link with bold to exercise renderLink through inline tokens", () => {
    const result = renderMarkdown("[**bold link text**](https://example.com)");
    expect(result).toContain("bold link text");
  });

  it("renders HTML inline content to exercise renderHtml RENDERERS entry", () => {
    // Inline HTML inside a paragraph - tests RENDERERS["html"] = renderHtml
    const result = renderMarkdown("Before <span>inline</span> after.");
    expect(result).toContain("Before");
    expect(result).toContain("after");
    expect(result).not.toContain("<span>");
  });

  it("renders horizontal rule to exercise hr renderer", () => {
    const result = renderMarkdown("---");
    expect(result).toContain("─");
  });

  it("renders table with plain cell content to exercise tablecell text fallback", () => {
    // Table with plain text in cells - tokens.length === 0 branch
    const result = renderMarkdown("| A | B |\n|---|---|\n| 1 | 2 |");
    expect(result).toContain("A");
    expect(result).toContain("1");
  });

  it("renders blockquote inside a list item to exercise renderBlockquote", () => {
    // Blockquote inline token inside a list item touches RENDERERS["blockquote"]
    const result = renderMarkdown("- > quoted inside list");
    expect(result).toContain("quoted inside list");
  });
});

describe("renderer methods from marked.defaults", () => {
  it("strong renderer formats bold text", () => {
    const { renderer } = marked.defaults;
    const result = renderer?.strong({ text: "bold", tokens: [] } as any);
    expect(result).toContain("bold");
  });

  it("em renderer formats italic text", () => {
    const { renderer } = marked.defaults;
    const result = renderer?.em({ text: "italic", tokens: [] } as any);
    expect(result).toContain("italic");
  });

  it("codespan renderer formats inline code", () => {
    const { renderer } = marked.defaults;
    const result = renderer?.codespan({ text: "code" } as any);
    expect(result).toContain("code");
  });

  it("del renderer handles both tokens.length branches", () => {
    const { renderer } = marked.defaults;
    // tokens.length > 0 branch
    const withTokens = renderer?.del({
      text: "fallback",
      tokens: [{ text: "nested", tokens: [], type: "text" }]
    } as any);
    expect(withTokens).toContain("nested");
    // tokens.length === 0 branch (text fallback)
    const withoutTokens = renderer?.del({ text: "plain", tokens: [] } as any);
    expect(withoutTokens).toContain("plain");
  });

  it("link renderer handles both tokens.length branches", () => {
    const { renderer } = marked.defaults;
    // tokens.length > 0 branch
    const withTokens = renderer?.link({
      href: EXAMPLE_URL,
      text: "fallback",
      tokens: [{ text: "click here", tokens: [], type: "text" }]
    } as any);
    expect(withTokens).toContain(EXAMPLE_URL);
    // tokens.length === 0 branch (text fallback)
    const withoutTokens = renderer?.link({
      href: EXAMPLE_URL,
      text: "plain",
      tokens: []
    } as any);
    expect(withoutTokens).toContain("plain");
  });

  it("image renderer formats images", () => {
    const { renderer } = marked.defaults;
    const result = renderer?.image({
      href: EXAMPLE_IMG_URL,
      text: "alt text"
    } as any);
    expect(result).toContain("alt text");
    expect(result).toContain(EXAMPLE_IMG_URL);
  });

  it("br renderer returns newline", () => {
    const { renderer } = marked.defaults;
    // @ts-expect-error for test
    const result = renderer?.br();
    expect(result).toBe("\n");
  });

  it("checkbox renderer handles checked and unchecked", () => {
    const { renderer } = marked.defaults;
    expect(renderer?.checkbox({ checked: true } as any)).toBe("[x]");
    expect(renderer?.checkbox({ checked: false } as any)).toBe("[ ]");
  });

  it("html renderer preserves raw HTML", () => {
    const { renderer } = marked.defaults;
    const result = renderer?.html({ text: "<b>raw</b>" } as any);
    expect(result).toBe("<b>raw</b>");
  });

  it("text renderer handles both tokens branches", () => {
    const { renderer } = marked.defaults;
    // text token with no nested tokens (uses token.text)
    const plain = renderer?.text({
      text: "simple",
      tokens: undefined,
      type: "text"
    } as any);
    expect(plain).toContain("simple");
    // text token with nested tokens
    const nested = renderer?.text({
      text: "fallback",
      tokens: [{ text: "nested content", tokens: [], type: "text" }],
      type: "text"
    } as any);
    expect(nested).toContain("nested content");
    // escape token (not type "text" - uses token.text)
    const escapeToken = renderer?.text({
      text: "*",
      tokens: undefined,
      type: "escape"
    } as any);
    expect(escapeToken).toContain("*");
  });

  it("tablecell renderer handles both tokens branches", () => {
    const { renderer } = marked.defaults;
    // tokens.length > 0 branch
    const withTokens = renderer?.tablecell({
      text: "fallback",
      tokens: [{ text: "formatted", tokens: [], type: "text" }]
    } as any);
    expect(withTokens).toContain("formatted");
    // tokens.length === 0 branch
    const withoutTokens = renderer?.tablecell({
      text: "plain",
      tokens: []
    } as any);
    expect(withoutTokens).toContain("plain");
  });

  it("space renderer returns a space", () => {
    const { renderer } = marked.defaults;
    // @ts-expect-error for test
    const result = renderer?.space();
    expect(result).toBe("\n");
  });

  it("listitem renderer formats list items", () => {
    const { renderer } = marked.defaults;
    const result = renderer?.listitem({
      checked: false,
      task: false,
      tokens: [{ text: "item", tokens: [], type: "text" }]
    } as any);
    expect(result).toContain("item");
  });

  it("space renderer returns newline via createNightOwlRenderer", () => {
    const renderer = createNightOwlRenderer();
    // @ts-expect-error marked's Renderer type requires a token arg, but our implementation ignores it
    expect(renderer.space?.()).toBe("\n");
  });

  it("text renderer recurses into nested space token", () => {
    const renderer = createNightOwlRenderer();
    // text token with nested space token => renderInlineToken("space") => renderSpace()
    const result = renderer.text?.({
      text: "fallback",
      tokens: [{ type: "space" }],
      type: "text"
    } as any);
    expect(result).toContain(" ");
  });

  it("text renderer recurses into unknown token type returning empty", () => {
    const renderer = createNightOwlRenderer();
    // text token with nested unknown token => renderInlineToken("unknown") => ""
    const result = renderer.text?.({
      text: "fallback",
      tokens: [{ type: "unknown" }],
      type: "text"
    } as any);
    expect(result).toBe("");
  });
});
