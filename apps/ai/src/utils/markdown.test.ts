import { describe, expect, it } from "vitest";

import { renderMarkdown } from "./markdown.js";

describe("renderMarkdown", () => {
  it("renders plain text as a paragraph", () => {
    const result = renderMarkdown("Hello world");
    expect(result).toContain("Hello world");
  });

  it("renders h1 headings", () => {
    const result = renderMarkdown("# Heading 1");
    expect(result).toContain("Heading 1");
    expect(result).not.toContain("# Heading 1");
  });

  it("renders h2 headings", () => {
    const result = renderMarkdown("## Heading 2");
    expect(result).toContain("Heading 2");
  });

  it("renders h3 headings", () => {
    const result = renderMarkdown("### Heading 3");
    expect(result).toContain("Heading 3");
  });

  it("renders h4 headings", () => {
    const result = renderMarkdown("#### Heading 4");
    expect(result).toContain("Heading 4");
  });

  it("renders bold text", () => {
    const result = renderMarkdown("**bold text**");
    expect(result).toContain("bold text");
    expect(result).not.toContain("**bold text**");
  });

  it("renders italic text", () => {
    const result = renderMarkdown("*italic text*");
    expect(result).toContain("italic text");
    expect(result).not.toContain("*italic text*");
  });

  it("renders code blocks", () => {
    const result = renderMarkdown("```\ncode here\n```");
    expect(result).toContain("code here");
  });

  it("renders inline code", () => {
    const result = renderMarkdown("`someCode`");
    expect(result).toContain("someCode");
    expect(result).not.toContain("`someCode`");
  });

  it("renders links", () => {
    const result = renderMarkdown("[link text](https://example.com)");
    expect(result).toContain("link text");
    expect(result).toContain("https://example.com");
  });

  it("renders unordered lists", () => {
    const result = renderMarkdown("- item 1\n- item 2");
    expect(result).toContain("item 1");
    expect(result).toContain("item 2");
  });

  it("renders blockquotes", () => {
    const result = renderMarkdown("> quoted text");
    expect(result).toContain("quoted text");
    expect(result).not.toContain("> quoted text");
  });

  it("renders horizontal rules", () => {
    const result = renderMarkdown("---");
    // Should produce a line of dashes
    expect(result).toContain("─");
  });

  it("strips any HTML tags from the output", () => {
    const result = renderMarkdown("<b>raw html</b>");
    expect(result).not.toContain("<b>");
    expect(result).not.toContain("</b>");
  });

  it("handles empty input", () => {
    const result = renderMarkdown("");
    expect(result).toBe("");
  });

  it("handles complex mixed markdown", () => {
    const input = `# Plan

## Introduction

This is a **bold** statement with \`inline code\`.

- Item 1
- Item 2

> A quote

\`\`\`
const x = 1;
\`\`\`
`;
    const result = renderMarkdown(input);
    expect(result).toContain("Plan");
    expect(result).toContain("Introduction");
    expect(result).toContain("bold");
    expect(result).toContain("inline code");
    expect(result).toContain("Item 1");
    expect(result).toContain("Item 2");
    expect(result).toContain("A quote");
    expect(result).toContain("const x = 1;");
  });
});
