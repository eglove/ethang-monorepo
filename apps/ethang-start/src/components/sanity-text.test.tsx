import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@astryxdesign/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@astryxdesign/core")>();
  return {
    ...actual,
    Blockquote: ({
      children,
      cite
    }: {
      children: React.ReactNode;
      cite?: React.ReactNode;
    }) => {
      return (
        <blockquote>
          {children}
          {Boolean(cite) && <footer>{cite}</footer>}
        </blockquote>
      );
    },
    Code: ({ children }: { children: React.ReactNode }) => {
      return <code>{children}</code>;
    },
    CodeBlock: ({ code, language }: { code: string; language?: string }) => {
      return (
        <pre data-language={language}>
          <code>{code}</code>
        </pre>
      );
    },
    Heading: ({
      children,
      level
    }: {
      children: React.ReactNode;
      level: 1 | 2 | 3 | 4 | 5 | 6;
    }) => {
      const Tag = `h${level}` as React.ElementType;
      return <Tag>{children}</Tag>;
    },
    Link: ({
      children,
      href
    }: {
      children: React.ReactNode;
      href?: string;
    }) => {
      return <a href={href}>{children}</a>;
    },
    Text: ({
      as,
      children,
      className
    }: {
      as?: React.ElementType;
      children: React.ReactNode;
      className?: string;
    }) => {
      const Tag = as ?? "span";
      return <Tag className={className}>{children}</Tag>;
    }
  };
});

import { SanityText } from "./sanity-text.tsx";

const MOCK_BLOCK = "block";
const MOCK_SPAN = "span";
const MOCK_AUTHOR = "Author Name";
const MOCK_SOURCE = "Source Title";
const MOCK_QUOTE_TEXT = "Quote text";
const MOCK_NORMAL = "normal";
const MOCK_BLOCKQUOTE = "blockquote";
const MOCK_LINK1 = "link1";

describe("SanityText - Blocks, headings, marks", () => {
  it("renders blockquote style", () => {
    const value = [
      {
        _key: "block1",
        _type: MOCK_BLOCK,
        author: MOCK_AUTHOR,
        children: [{ _key: "span1", _type: MOCK_SPAN, text: MOCK_QUOTE_TEXT }],
        source: MOCK_SOURCE,
        sourceUrl: "https://source.com",
        style: MOCK_BLOCKQUOTE
      }
    ];

    render(<SanityText value={value} />);
    expect(screen.getByText(MOCK_QUOTE_TEXT)).toBeDefined();
    expect(screen.getByText(/Author Name/u)).toBeDefined();
  });

  it("renders blockquote style with source but no sourceUrl", () => {
    const value = [
      {
        _key: "block1",
        _type: MOCK_BLOCK,
        author: MOCK_AUTHOR,
        children: [{ _key: "span1", _type: MOCK_SPAN, text: MOCK_QUOTE_TEXT }],
        source: MOCK_SOURCE,
        sourceUrl: null,
        style: MOCK_BLOCKQUOTE
      }
    ];

    render(<SanityText value={value} />);
    expect(screen.getByText(MOCK_QUOTE_TEXT)).toBeDefined();
    expect(screen.getByText(/Author Name/u)).toBeDefined();
    expect(screen.getByText(/Source Title/u)).toBeDefined();
  });

  it("renders blockquote style with no author and no source", () => {
    const value = [
      {
        _key: "block1",
        _type: MOCK_BLOCK,
        children: [{ _key: "span1", _type: MOCK_SPAN, text: MOCK_QUOTE_TEXT }],
        style: MOCK_BLOCKQUOTE
      }
    ];

    render(<SanityText value={value} />);
    expect(screen.getByText(MOCK_QUOTE_TEXT)).toBeDefined();
  });

  it("renders headings and normal blocks", () => {
    const value = [
      {
        _key: "h2",
        _type: MOCK_BLOCK,
        children: [{ _key: "span2", _type: MOCK_SPAN, text: "Heading 2" }],
        style: "h2"
      },
      {
        _key: "h3",
        _type: MOCK_BLOCK,
        children: [{ _key: "span3", _type: MOCK_SPAN, text: "Heading 3" }],
        style: "h3"
      },
      {
        _key: "h4",
        _type: MOCK_BLOCK,
        children: [{ _key: "span4", _type: MOCK_SPAN, text: "Heading 4" }],
        style: "h4"
      },
      {
        _key: "normal",
        _type: MOCK_BLOCK,
        children: [{ _key: "span5", _type: MOCK_SPAN, text: "Normal text" }],
        style: MOCK_NORMAL
      }
    ];

    render(<SanityText value={value} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Heading 2" })
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 3, name: "Heading 3" })
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 4, name: "Heading 4" })
    ).toBeDefined();
    expect(screen.getByText("Normal text")).toBeDefined();
  });

  it("renders marks like code, em, strong, and link", () => {
    const value = [
      {
        _key: "block2",
        _type: MOCK_BLOCK,
        children: [
          { _key: "spanA", _type: MOCK_SPAN, marks: ["code"], text: "Code" },
          { _key: "spanB", _type: MOCK_SPAN, marks: ["em"], text: "Em" },
          {
            _key: "spanC",
            _type: MOCK_SPAN,
            marks: ["strong"],
            text: "Strong"
          },
          { _key: "spanD", _type: MOCK_SPAN, marks: [MOCK_LINK1], text: "Link" }
        ],
        style: MOCK_NORMAL
      }
    ];

    const markDefs = [
      {
        _key: MOCK_LINK1,
        _type: "link",
        href: "https://google.com"
      }
    ];

    render(<SanityText value={[{ ...value[0], markDefs }]} />);
    expect(screen.getByText("Code")).toBeDefined();
    expect(screen.getByText("Em")).toBeDefined();
    expect(screen.getByText("Strong")).toBeDefined();
  });

  it("renders link mark with no href", () => {
    const value = [
      {
        _key: "block2",
        _type: MOCK_BLOCK,
        children: [
          { _key: "spanD", _type: MOCK_SPAN, marks: [MOCK_LINK1], text: "Link" }
        ],
        style: MOCK_NORMAL
      }
    ];

    const markDefs = [
      {
        _key: MOCK_LINK1,
        _type: "link",
        href: null
      }
    ];

    render(<SanityText value={[{ ...value[0], markDefs }]} />);
    expect(screen.getByText("Link")).toBeDefined();
  });
});

describe("SanityText - Custom Quote and Code types", () => {
  it("renders custom blockquote type", () => {
    const value = [
      {
        _key: "quote1",
        _type: "quote",
        author: "Author",
        quote: "Main Quote Content",
        source: "Source",
        sourceUrl: "https://source.com"
      }
    ];

    render(<SanityText value={value} />);
    expect(screen.getByText("Main Quote Content")).toBeDefined();
  });

  it("renders custom code type", () => {
    const value1 = [
      {
        _key: "code1",
        _type: "code",
        code: "const x = 42;",
        language: "javascript"
      }
    ];
    const value2 = [
      {
        _key: "code2",
        _type: "code",
        code: "const y = 24;",
        language: null
      }
    ];

    const { unmount } = render(<SanityText value={value1} />);
    expect(screen.getByRole("code")).toBeDefined();
    unmount();

    render(<SanityText value={value2} />);
    expect(screen.getByRole("code")).toBeDefined();
  });

  it("renders custom code type with no code content", () => {
    const value = [
      {
        _key: "code1",
        _type: "code",
        code: null,
        language: "javascript"
      }
    ];

    const { container } = render(<SanityText value={value} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders custom code type with no language falls back to typescript", () => {
    const value = [
      {
        _key: "code1",
        _type: "code",
        code: "const z = 99;"
      }
    ];

    render(<SanityText value={value} />);
    expect(screen.getByRole("code")).toBeDefined();
  });
});

describe("SanityText - Custom Image and Video types", () => {
  it("renders custom image type", () => {
    const value = [
      {
        _key: "img1",
        _type: "image",
        alt: "Alternate text",
        asset: {
          metadata: {
            dimensions: {
              aspectRatio: 1.5,
              height: 600,
              width: 800
            }
          },
          url: "https://cdn.sanity.io/images/project/dataset/img.png"
        },
        caption: "Image Caption"
      }
    ];

    const { container } = render(<SanityText value={value} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(
      "https://cdn.sanity.io/images/project/dataset/img.png"
    );
  });

  it("renders custom image type with no asset url", () => {
    const value = [
      {
        _key: "img1",
        _type: "image",
        asset: null
      }
    ];

    const { container } = render(<SanityText value={value} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders custom video type", () => {
    const value1 = [
      {
        _key: "vid1",
        _type: "video",
        title: "Test Video",
        videoId: "12345"
      }
    ];
    const value2 = [
      {
        _key: "vid2",
        _type: "video",
        title: null,
        videoId: "67890"
      }
    ];

    const { unmount } = render(<SanityText value={value1} />);
    expect(
      screen.getByLabelText("Test Video - YouTube video preview")
    ).toBeDefined();
    unmount();

    render(<SanityText value={value2} />);
    expect(
      screen.getByLabelText("YouTube video - YouTube video preview")
    ).toBeDefined();
  });

  it("renders custom video type with no videoId", () => {
    const value = [
      {
        _key: "vid1",
        _type: "video",
        videoId: null
      }
    ];

    const { container } = render(<SanityText value={value} />);
    expect(container.firstChild).toBeNull();
  });
});
