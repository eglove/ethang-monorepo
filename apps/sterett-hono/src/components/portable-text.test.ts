import { describe, expect, it } from "vitest";

import { renderPortableText } from "../test-utils/render.tsx";

describe("portableText", () => {
  it("renders a prose div when content is undefined", async () => {
    // @ts-expect-error testing
    const html = await renderPortableText();

    expect(html).toContain("prose");
  });

  it("renders text block content", async () => {
    const content = [
      {
        _key: "b1",
        _type: "block",
        children: [
          { _key: "s1", _type: "span", marks: [], text: "Hello world" },
        ],
        markDefs: [],
        style: "normal",
      },
    ];

    const html = await renderPortableText(content as never);

    expect(html).toContain("Hello world");
  });

  it("renders multiple text blocks", async () => {
    const content = [
      {
        _key: "b1",
        _type: "block",
        children: [{ _key: "s1", _type: "span", marks: [], text: "First" }],
        markDefs: [],
        style: "normal",
      },
      {
        _key: "b2",
        _type: "block",
        children: [{ _key: "s2", _type: "span", marks: [], text: "Second" }],
        markDefs: [],
        style: "normal",
      },
    ];

    const html = await renderPortableText(content as never);

    expect(html).toContain("First");
    expect(html).toContain("Second");
  });

  it("renders image blocks with alt text and src", async () => {
    const content = [
      {
        _key: "img1",
        _type: "image",
        altText: "A scenic lake",
        asset: {
          _id: "asset1",
          metadata: { dimensions: { height: 100, width: 200 }, lqip: "" },
          url: "https://example.com/lake.jpg",
        },
      },
    ];

    const html = await renderPortableText(content as never);

    expect(html).toContain('alt="A scenic lake"');
    expect(html).toContain("https://example.com/lake.jpg");
  });

  it("renders empty string for image block with missing asset", async () => {
    const content = [
      {
        _key: "img1",
        _type: "image",
        altText: "No asset",
      },
    ];

    const html = await renderPortableText(content as never);

    expect(html).toContain("prose");
  });
});
