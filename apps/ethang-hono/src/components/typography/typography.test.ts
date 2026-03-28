// cspell:ignore noopener noreferrer hrefs
import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { Blockquote } from "./blockquote.tsx";
import { H1 } from "./h1.tsx";
import { H2 } from "./h2.tsx";
import { H3 } from "./h3.tsx";
import { HR } from "./hr.tsx";
import { InlineCode } from "./inline-code.tsx";
import { Link } from "./link.tsx";
import { List } from "./list.tsx";
import { P } from "./p.tsx";

describe(H1, () => {
  it("renders an h1 element with text content", async () => {
    const html = String(await H1({ children: "Page Title" }));

    expect(html).toContain("<h1");
    expect(html).toContain("Page Title");
  });

  it("merges custom className with base classes", async () => {
    const html = String(
      await H1({ children: "x", className: "my-custom-class" }),
    );

    expect(html).toContain("my-custom-class");
    expect(html).toContain("text-4xl");
  });
});

describe(H2, () => {
  it("renders an h2 element", async () => {
    const html = String(await H2({ children: "Section Title" }));

    expect(html).toContain("<h2");
    expect(html).toContain("Section Title");
  });

  it("applies custom className", async () => {
    const html = String(await H2({ children: "x", className: "border-none" }));

    expect(html).toContain("border-none");
  });
});

describe(H3, () => {
  it("renders an h3 element", async () => {
    const html = String(await H3({ children: "Subsection" }));

    expect(html).toContain("<h3");
    expect(html).toContain("Subsection");
  });
});

describe(HR, () => {
  it("renders a self-closing hr element", async () => {
    const html = String(await HR());

    expect(html).toContain("hr");
  });
});

describe(InlineCode, () => {
  it("renders a code element", async () => {
    const html = String(await InlineCode({ children: "const x = 1" }));

    expect(html).toContain("<code");
    expect(html).toContain("const x = 1");
  });
});

describe(List, () => {
  it("renders a ul element", async () => {
    const html = String(await List({ children: "<li>Item</li>" }));

    expect(html).toContain("<ul");
  });
});

describe(P, () => {
  it("renders a p element", async () => {
    const html = String(await P({ children: "Paragraph text" }));

    expect(html).toContain("<p");
    expect(html).toContain("Paragraph text");
  });

  it("applies optional id attribute", async () => {
    const html = String(await P({ children: "x", id: "my-para" }));

    expect(html).toContain('id="my-para"');
  });

  it("merges custom className", async () => {
    const html = String(await P({ children: "x", className: "text-danger" }));

    expect(html).toContain("text-danger");
  });
});

describe(Link, () => {
  it("renders an anchor element with href", async () => {
    const html = String(await Link({ children: "Click me", href: "/about" }));

    expect(html).toContain("<a");
    expect(html).toContain('href="/about"');
    expect(html).toContain("Click me");
  });

  it("adds target and rel for external links", async () => {
    const html = String(
      await Link({ children: "External", href: "https://example.com" }),
    );

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("does not add target for internal links with relative path", async () => {
    const html = String(await Link({ children: "Home", href: "/home" }));

    expect(html).not.toContain("target");
  });

  it("does not add target for non-parseable hrefs", async () => {
    const html = String(await Link({ children: "Anchor", href: "#section" }));

    expect(html).not.toContain("target");
  });

  it("merges custom className", async () => {
    const html = String(
      await Link({ children: "x", className: "text-red-500", href: "/" }),
    );

    expect(html).toContain("text-red-500");
  });
});

describe(Blockquote, () => {
  it("renders a blockquote element", async () => {
    const html = String(await Blockquote({ children: "A wise quote" }));

    expect(html).toContain("blockquote");
    expect(html).toContain("A wise quote");
  });

  it("renders author attribution when author is provided", async () => {
    const html = String(
      await Blockquote({ author: "Confucius", children: "Quote" }),
    );

    expect(html).toContain("Confucius");
    expect(html).toContain("<footer");
  });

  it("renders source with link when sourceUrl is provided", async () => {
    const testApp = new Hono();
    testApp.get("/", async (c) => {
      const result = await Blockquote({
        children: "Quote",
        source: "The Book",
        sourceUrl: "https://example.com",
      });
      return c.html(result as never);
    });
    const response = await testApp.request("/");
    const html = await response.text();

    expect(html).toContain("The Book");
    expect(html).toContain('href="https://example.com"');
  });

  it("renders source without link when only source is provided", async () => {
    const html = String(
      await Blockquote({ children: "Quote", source: "The Source" }),
    );

    expect(html).toContain("The Source");
    expect(html).toContain("<cite");
  });

  it("renders author and source separated by comma", async () => {
    const html = String(
      await Blockquote({
        author: "Author",
        children: "Quote",
        source: "Source",
      }),
    );

    expect(html).toContain("Author");
    expect(html).toContain("Source");
    expect(html).toContain(",");
  });

  it("renders no footer when neither author nor source is provided", async () => {
    const html = String(await Blockquote({ children: "Quote" }));

    expect(html).not.toContain("<footer");
  });
});
