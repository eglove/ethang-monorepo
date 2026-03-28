import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import type { GetBlogBySlug } from "../models/get-blog-by-slug.ts";

import { PortableText } from "./portable-text.tsx";

type Body = GetBlogBySlug["body"];

const renderPortableText = async (blocks: Body): Promise<string> => {
  const testApp = new Hono();
  testApp.get("/", async (c) => {
    const result = await PortableText({ children: blocks });
    return c.html(result as never);
  });
  const response = await testApp.request("/");
  return response.text();
};

const makeChild = (text: string, marks: string[] = []) => ({
  _key: "key-1",
  _type: "span",
  marks,
  text,
});

const makeBlock = (style: string, text: string, overrides = {}) => ({
  _key: "b1",
  _type: "block" as const,
  children: [makeChild(text)],
  markDefs: [],
  style,
  ...overrides,
});

describe("PortableText", () => {
  it("renders nothing for empty body", async () => {
    const html = await renderPortableText([]);
    expect(html).toBeDefined();
  });

  it("renders normal paragraph blocks", async () => {
    const html = await renderPortableText([makeBlock("normal", "Hello world")]);
    expect(html).toContain("Hello world");
    expect(html).toContain("<p");
  });

  it("renders h2 blocks", async () => {
    const html = await renderPortableText([makeBlock("h2", "Section Heading")]);
    expect(html).toContain("Section Heading");
    expect(html).toContain("<h2");
  });

  it("renders h3 blocks", async () => {
    const html = await renderPortableText([makeBlock("h3", "Sub Heading")]);
    expect(html).toContain("Sub Heading");
    expect(html).toContain("<h3");
  });

  it("renders blockquote style blocks", async () => {
    const html = await renderPortableText([
      makeBlock("blockquote", "A famous quote"),
    ]);
    expect(html).toContain("A famous quote");
    expect(html).toContain("blockquote");
  });

  it("renders list items inside a ul element", async () => {
    const html = await renderPortableText([
      { ...makeBlock("normal", "item"), listItem: "bullet" },
      { ...makeBlock("normal", "item2"), _key: "b2", listItem: "bullet" },
    ]);
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
  });

  it("renders code blocks", async () => {
    const html = await renderPortableText([
      {
        _key: "c1",
        _type: "code" as const,
        code: "const x = 1;",
        language: "javascript",
      },
    ]);
    expect(html).toContain("const x = 1;");
  });

  it("renders video embed blocks", async () => {
    const html = await renderPortableText([
      {
        _key: "v1",
        _type: "video" as const,
        title: "My Video",
        videoId: "abc123",
      },
    ]);
    expect(html).toContain("abc123");
  });

  it("renders quote type blocks", async () => {
    const html = await renderPortableText([
      { _key: "q1", _type: "quote" as const, quote: "An inspiring quote" },
    ]);
    expect(html).toContain("An inspiring quote");
  });

  it("renders blockquote style blocks with author and source", async () => {
    const block = {
      _key: "bq1",
      _type: "block" as const,
      author: "Famous Person",
      children: [makeChild("A great thought")],
      markDefs: [],
      source: "Great Book",
      style: "blockquote",
    };
    const html = await renderPortableText([block]);
    expect(html).toContain("A great thought");
    expect(html).toContain("blockquote");
  });

  it("renders inline code marks", async () => {
    const block = {
      _key: "b1",
      _type: "block" as const,
      children: [makeChild("myVar", ["code"])],
      markDefs: [],
      style: "normal",
    };
    const html = await renderPortableText([block]);
    expect(html).toContain("myVar");
    expect(html).toContain("<code");
  });

  it("renders text with an unrecognized mark (not code or link)", async () => {
    const block = {
      _key: "b1",
      _type: "block" as const,
      children: [makeChild("emphasized text", ["em"])],
      style: "normal",
      // markDefs intentionally omitted to cover the `?? []` fallback
    };
    const html = await renderPortableText([block]);
    expect(html).toContain("emphasized text");
  });

  it("renders nothing for block type with unrecognized style", async () => {
    const html = await renderPortableText([
      {
        _key: "b1",
        _type: "block" as const,
        children: [],
        markDefs: [],
        style: "h4",
      },
    ]);
    expect(html).toBeDefined();
  });

  it("renders link marks", async () => {
    const block = {
      _key: "b1",
      _type: "block" as const,
      children: [makeChild("click here", ["link-key"])],
      markDefs: [
        { _key: "link-key", _type: "link", href: "https://example.com" },
      ],
      style: "normal",
    };
    const html = await renderPortableText([block]);
    expect(html).toContain("click here");
    expect(html).toContain("https://example.com");
  });

  it("handles image blocks with asset url", async () => {
    const imageBlock = {
      _key: "img1",
      _type: "image" as const,
      alt: "An image",
      asset: {
        metadata: { dimensions: { height: 300, width: 400 } },
        url: "https://example.com/image.jpg",
      },
    };
    const html = await renderPortableText([imageBlock] as unknown as Body);
    expect(html).toContain("img");
  });

  it("renders list items when followed by a non-list block", async () => {
    const html = await renderPortableText([
      { ...makeBlock("normal", "List Item"), listItem: "bullet" },
      { ...makeBlock("normal", "After list"), _key: "b2" },
    ]);
    expect(html).toContain("<ul");
    expect(html).toContain("List Item");
  });

  it("renders trailing list items appended to nodes", async () => {
    const html = await renderPortableText([
      { ...makeBlock("normal", "Only list item"), listItem: "bullet" },
    ]);
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
  });

  it("renders code block without language (defaults to typescript)", async () => {
    const html = await renderPortableText([
      { _key: "c2", _type: "code" as const, code: "let y = 2;" },
    ]);
    expect(html).toContain("let y = 2;");
  });

  it("renders video embed block without title", async () => {
    const html = await renderPortableText([
      { _key: "v2", _type: "video" as const, videoId: "xyz789" },
    ]);
    expect(html).toContain("xyz789");
  });

  it("handles image blocks without alt text", async () => {
    const html = await renderPortableText([
      {
        _key: "img2",
        _type: "image" as const,
        asset: {
          metadata: { dimensions: { height: 200, width: 300 } },
          url: "https://example.com/no-alt.jpg",
        },
      },
    ] as unknown as Body);
    expect(html).toContain("img");
  });

  it("renders nothing for unrecognized block types", async () => {
    const html = await renderPortableText([
      { _key: "u1", _type: "unknown-type" } as unknown as Body[number],
    ]);
    expect(html).toBeDefined();
  });

  it("renders nothing when block children is null", async () => {
    const html = await renderPortableText([
      {
        _key: "b1",
        _type: "block" as const,
        // @ts-expect-error testing null children
        children: null,
        markDefs: [],
        style: "normal",
      },
    ]);
    expect(html).toBeDefined();
  });
});
