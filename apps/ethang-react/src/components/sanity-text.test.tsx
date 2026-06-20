import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SanityText } from "./sanity-text.tsx";

const MOCK_BLOCK = "block";
const MOCK_SPAN = "span";
const MOCK_AUTHOR = "Author Name";
const MOCK_SOURCE = "Source Title";
const MOCK_QUOTE_TEXT = "Quote text";
const MOCK_NORMAL = "normal";
const MOCK_BLOCKQUOTE = "blockquote";
const MOCK_LINK1 = "link1";
const MOCK_IMAGE_URL = "https://mock-image-url.com";

vi.mock("@tanstack/react-router", () => {
  return {
    Link: ({ children, href, to }: any) => {
      return <a href={to ?? href}>{children}</a>;
    }
  };
});

vi.mock("@sanity/image-url", () => {
  const builder = {
    auto: () => {
      return builder;
    },
    fit: () => {
      return builder;
    },
    url: () => {
      return MOCK_IMAGE_URL;
    },
    width: () => {
      return builder;
    }
  };
  return {
    createImageUrlBuilder: () => {
      return {
        image: () => {
          return builder;
        }
      };
    }
  };
});

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
    expect(screen.getByRole("link", { name: MOCK_SOURCE })).toBeDefined();
  });

  it("renders blockquote style with source but no sourceUrl", () => {
    const value = [
      {
        _key: "block1",
        _type: MOCK_BLOCK,
        author: MOCK_AUTHOR,
        children: [{ _key: "span1", _type: MOCK_SPAN, text: MOCK_QUOTE_TEXT }],
        source: MOCK_SOURCE,
        sourceUrl: undefined,
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
    expect(
      screen.getByRole("link", { name: "Link" }).getAttribute("href")
    ).toBe("https://google.com");
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
        href: undefined
      }
    ];

    const { container } = render(
      <SanityText value={[{ ...value[0], markDefs }]} />
    );
    expect(container.querySelector(":scope a")?.getAttribute("href")).toBe("");
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
        language: undefined
      }
    ];

    const { unmount } = render(<SanityText value={value1} />);
    expect(screen.getByRole("code").textContent).toBe("const x = 42;");
    unmount();

    render(<SanityText value={value2} />);
    expect(screen.getByRole("code").textContent).toBe("const y = 24;");
  });

  it("renders custom code type with no code content", () => {
    const value = [
      {
        _key: "code1",
        _type: "code",
        code: undefined,
        language: "javascript"
      }
    ];

    const { container } = render(<SanityText value={value} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("SanityText - Custom Image and Video types", () => {
  it("renders custom image type", () => {
    const value1 = [
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
    const value2 = [
      {
        _key: "img2",
        _type: "image",
        asset: {
          url: "https://cdn.sanity.io/images/project/dataset/img2.png"
        }
      }
    ];

    const { container: container1, unmount } = render(
      <SanityText value={value1} />
    );
    const img1 = container1.querySelector(":scope img");
    expect(img1).not.toBeNull();
    expect(img1?.getAttribute("src")).toBe(MOCK_IMAGE_URL);
    expect(img1?.getAttribute("alt")).toBe("Alternate text");
    expect(screen.getByText("Image Caption")).toBeDefined();
    unmount();

    const { container: container2 } = render(<SanityText value={value2} />);
    const img2 = container2.querySelector(":scope img");
    expect(img2).not.toBeNull();
    expect(img2?.getAttribute("src")).toBe(MOCK_IMAGE_URL);
    expect(img2?.getAttribute("alt")).toBe("");
  });

  it("renders custom image type with no asset url", () => {
    const value = [
      {
        _key: "img1",
        _type: "image",
        asset: undefined
      }
    ];

    const { container } = render(<SanityText value={value} />);
    expect(container).toBeEmptyDOMElement();
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
        title: undefined,
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
        videoId: undefined
      }
    ];

    const { container } = render(<SanityText value={value} />);
    expect(container).toBeEmptyDOMElement();
  });
});
