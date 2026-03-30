import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import type { GetBlogBySlug } from "../models/get-blog-by-slug.ts";

import { PortableText } from "./portable-text.tsx";

type Body = GetBlogBySlug["body"];

const BLOCK_KEY = "b1";
const BLOCK_TYPE = "block" as const;
const CODE_TYPE = "code" as const;
const IMAGE_TYPE = "image" as const;
const VIDEO_TYPE = "video" as const;
const NORMAL_STYLE = "normal";
const BLOCKQUOTE_STYLE = "blockquote";
const BULLET_LIST_ITEM = "bullet";
const LINK_MARK_KEY = "link-key";
const UL_TAG = "<ul";
const CLICK_HERE = "click here";

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
  _key: BLOCK_KEY,
  _type: BLOCK_TYPE,
  children: [makeChild(text)],
  markDefs: [],
  style,
  ...overrides,
});

describe(`${PortableText.name} - block styles`, () => {
  it("renders nothing for empty body", async () => {
    const html = await renderPortableText([]);

    expect(html).toBeDefined();
  });

  it("renders normal paragraph blocks", async () => {
    const html = await renderPortableText([
      makeBlock(NORMAL_STYLE, "Hello world"),
    ]);

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
      makeBlock(BLOCKQUOTE_STYLE, "A famous quote"),
    ]);

    expect(html).toContain("A famous quote");
    expect(html).toContain(BLOCKQUOTE_STYLE);
  });

  it("renders blockquote style blocks with author and source", async () => {
    const block = {
      _key: "bq1",
      _type: BLOCK_TYPE,
      author: "Famous Person",
      children: [makeChild("A great thought")],
      markDefs: [],
      source: "Great Book",
      style: BLOCKQUOTE_STYLE,
    };
    const html = await renderPortableText([block]);

    expect(html).toContain("A great thought");
    expect(html).toContain(BLOCKQUOTE_STYLE);
  });
});

describe(`${PortableText.name} - list rendering`, () => {
  it("renders list items inside a ul element", async () => {
    const html = await renderPortableText([
      { ...makeBlock(NORMAL_STYLE, "item"), listItem: BULLET_LIST_ITEM },
      {
        ...makeBlock(NORMAL_STYLE, "item2"),
        _key: "b2",
        listItem: BULLET_LIST_ITEM,
      },
    ]);

    expect(html).toContain(UL_TAG);
    expect(html).toContain("<li");
  });

  it("renders list items when followed by a non-list block", async () => {
    const html = await renderPortableText([
      { ...makeBlock(NORMAL_STYLE, "List Item"), listItem: BULLET_LIST_ITEM },
      { ...makeBlock(NORMAL_STYLE, "After list"), _key: "b2" },
    ]);

    expect(html).toContain(UL_TAG);
    expect(html).toContain("List Item");
  });

  it("renders trailing list items appended to nodes", async () => {
    const html = await renderPortableText([
      {
        ...makeBlock(NORMAL_STYLE, "Only list item"),
        listItem: BULLET_LIST_ITEM,
      },
    ]);

    expect(html).toContain(UL_TAG);
    expect(html).toContain("<li");
  });
});

describe(`${PortableText.name} - inline block types`, () => {
  it("renders code blocks", async () => {
    const html = await renderPortableText([
      {
        _key: "c1",
        _type: CODE_TYPE,
        code: "const x = 1;",
        language: "javascript",
      },
    ]);

    expect(html).toContain("const x = 1;");
  });

  it("renders code block without language (defaults to typescript)", async () => {
    const html = await renderPortableText([
      { _key: "c2", _type: CODE_TYPE, code: "let y = 2;" },
    ]);

    expect(html).toContain("let y = 2;");
  });

  it("renders video embed blocks", async () => {
    const html = await renderPortableText([
      {
        _key: "v1",
        _type: VIDEO_TYPE,
        title: "My Video",
        videoId: "abc123",
      },
    ]);

    expect(html).toContain("abc123");
  });

  it("renders video embed block without title", async () => {
    const html = await renderPortableText([
      { _key: "v2", _type: VIDEO_TYPE, videoId: "xyz789" },
    ]);

    expect(html).toContain("xyz789");
  });

  it("renders quote type blocks", async () => {
    const html = await renderPortableText([
      { _key: "q1", _type: "quote" as const, quote: "An inspiring quote" },
    ]);

    expect(html).toContain("An inspiring quote");
  });

  it("handles image blocks with asset url", async () => {
    const imageBlock = {
      _key: "img1",
      _type: IMAGE_TYPE,
      alt: "An image",
      asset: {
        metadata: { dimensions: { height: 300, width: 400 } },
        url: "https://example.com/image.jpg",
      },
    };
    const html = await renderPortableText([imageBlock] as unknown as Body);

    expect(html).toContain("img");
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
});

describe(`${PortableText.name} - text marks`, () => {
  it("renders inline code marks", async () => {
    const block = {
      _key: "b1",
      _type: BLOCK_TYPE,
      children: [makeChild("myVar", ["code"])],
      markDefs: [],
      style: "normal",
    };
    const html = await renderPortableText([block]);

    expect(html).toContain("myVar");
    expect(html).toContain("<code");
  });

  it("renders link marks", async () => {
    const block = {
      _key: "b1",
      _type: BLOCK_TYPE,
      children: [makeChild(CLICK_HERE, [LINK_MARK_KEY])],
      markDefs: [
        { _key: LINK_MARK_KEY, _type: "link", href: "https://example.com" },
      ],
      style: "normal",
    };
    const html = await renderPortableText([block]);

    expect(html).toContain(CLICK_HERE);
    expect(html).toContain("https://example.com");
  });

  it("renders link marks without href (falls back to empty string)", async () => {
    const block = {
      _key: "b1",
      _type: BLOCK_TYPE,
      children: [makeChild(CLICK_HERE, [LINK_MARK_KEY])],
      markDefs: [{ _key: LINK_MARK_KEY, _type: "link" }],
      style: "normal",
    };

    // @ts-expect-error for test
    const html = await renderPortableText([block]);

    expect(html).toContain(CLICK_HERE);
  });

  it("renders text with an unrecognized mark (not code or link)", async () => {
    const block = {
      _key: "b1",
      _type: BLOCK_TYPE,
      children: [makeChild("emphasized text", ["em"])],
      style: "normal",
      // markDefs intentionally omitted to cover the `?? []` fallback
    };
    const html = await renderPortableText([block]);

    expect(html).toContain("emphasized text");
  });
});

describe(`${PortableText.name} - edge cases`, () => {
  it("renders nothing for block type with undefined style", async () => {
    const html = await renderPortableText([
      {
        _key: "b1",
        _type: BLOCK_TYPE,
        children: [],
        markDefs: [],
      },
    ]);

    expect(html).toBeDefined();
  });

  it("renders nothing for block type with unrecognized style", async () => {
    const html = await renderPortableText([
      {
        _key: "b1",
        _type: BLOCK_TYPE,
        children: [],
        markDefs: [],
        style: "h4",
      },
    ]);

    expect(html).toBeDefined();
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
        _type: BLOCK_TYPE,
        // @ts-expect-error testing null children
        children: null,
        markDefs: [],
        style: "normal",
      },
    ]);

    expect(html).toBeDefined();
  });

  it("renders nothing for image block without asset url", async () => {
    const html = await renderPortableText([
      { _key: "img3", _type: IMAGE_TYPE } as unknown as Body[number],
    ]);

    expect(html).not.toContain("<img");
  });

  it("renders nothing for code block without code property", async () => {
    const html = await renderPortableText([
      { _key: "c3", _type: CODE_TYPE } as unknown as Body[number],
    ]);

    expect(html).not.toContain("<code");
  });

  it("renders nothing for video block without videoId", async () => {
    const html = await renderPortableText([
      { _key: "v3", _type: VIDEO_TYPE } as unknown as Body[number],
    ]);

    expect(html).not.toContain("iframe");
  });

  it("renders nothing for quote block without quote property", async () => {
    const html = await renderPortableText([
      { _key: "q2", _type: "quote" as const } as unknown as Body[number],
    ]);

    expect(html).not.toContain(BLOCKQUOTE_STYLE);
  });
});
