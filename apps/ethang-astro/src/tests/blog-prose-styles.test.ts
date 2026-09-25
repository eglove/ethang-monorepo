import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const stylesheetPath = new URL("../styles/global.css", import.meta.url);

describe("blog prose list styles", () => {
  it("restores bullets and numbering removed by the Tailwind preflight reset", async () => {
    const css = await readFile(stylesheetPath, "utf8");

    expect(css).toMatch(/\.blog-prose ul\s*\{[^}]*list-style-type:\s*disc/u);
    expect(css).toMatch(/\.blog-prose ol\s*\{[^}]*list-style-type:\s*decimal/u);
  });

  it("restores list indentation and spacing", async () => {
    const css = await readFile(stylesheetPath, "utf8");

    expect(css).toMatch(
      /\.blog-prose ul\s*\{[^}]*padding-inline-start:[^;}]+/u
    );
    expect(css).toMatch(
      /\.blog-prose ol\s*\{[^}]*padding-inline-start:[^;}]+/u
    );
    expect(css).toMatch(/\.blog-prose li\s*\{[^}]*margin:[^;}]+/u);
  });

  it("styles lists without non-baseline selectors like ::marker", async () => {
    const css = await readFile(stylesheetPath, "utf8");

    expect(css).not.toContain("::marker");
  });
});

describe("blog prose blockquote highlight", () => {
  it("sets quotations off with an accent bar and a tinted panel", async () => {
    const css = await readFile(stylesheetPath, "utf8");

    expect(css).toMatch(
      /\.blog-prose blockquote\s*\{[^}]*border-inline-start:\s*3px solid var\(--color-primary\)/u
    );
    expect(css).toMatch(
      /\.blog-prose blockquote\s*\{[^}]*background:\s*var\(--color-night-owl-bg\)/u
    );
    expect(css).toMatch(/\.blog-prose blockquote\s*\{[^}]*padding:[^;}]+/u);
    expect(css).toMatch(/\.blog-prose blockquote\s*\{[^}]*border-radius:[^;}]+/u);
  });

  it("tightens spacing between paragraphs inside a quotation", async () => {
    const css = await readFile(stylesheetPath, "utf8");

    expect(css).toMatch(/\.blog-prose blockquote p\s*\{[^}]*margin:[^;}]+/u);
  });
});
