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

  it("colors markers with the palette's bullet token", async () => {
    const css = await readFile(stylesheetPath, "utf8");

    expect(css).toMatch(
      /\.blog-prose li::marker\s*\{[^}]*color:\s*var\(--color-night-owl-mint\)/u
    );
  });
});
