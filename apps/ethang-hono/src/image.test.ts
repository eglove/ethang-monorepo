// cspell:ignore fetchpriority
import { describe, expect, it } from "vitest";

import { Image } from "./image.tsx";

describe(Image, () => {
  it("renders a figure with an img element", async () => {
    const html = String(
      await Image({
        alt: "A photo",
        height: 200,
        src: "photo.jpg",
        width: 300,
      }),
    );

    expect(html).toContain("<figure");
    expect(html).toContain("<img");
    expect(html).toContain("</figure>");
  });

  it("passes alt text to the img element", async () => {
    const html = String(
      await Image({
        alt: "Sunset view",
        height: 100,
        src: "a.jpg",
        width: 100,
      }),
    );

    expect(html).toContain('alt="Sunset view"');
  });

  it("passes src to the img element", async () => {
    const html = String(
      await Image({
        alt: "x",
        height: 50,
        src: "https://example.com/img.png",
        width: 50,
      }),
    );

    expect(html).toContain('src="https://example.com/img.png"');
  });

  it("passes width and height to the img element", async () => {
    const html = String(
      await Image({ alt: "x", height: 400, src: "a.jpg", width: 800 }),
    );

    expect(html).toContain('width="800"');
    expect(html).toContain('height="400"');
  });

  it("renders figcaption when caption is provided", async () => {
    const html = String(
      await Image({
        alt: "Chart",
        caption: "Figure 1: Sales data",
        height: 200,
        src: "chart.png",
        width: 400,
      }),
    );

    expect(html).toContain("<figcaption");
    expect(html).toContain("Figure 1: Sales data");
  });

  it("does not render figcaption when caption is absent", async () => {
    const html = String(
      await Image({ alt: "No caption", height: 100, src: "a.jpg", width: 100 }),
    );

    expect(html).not.toContain("<figcaption");
  });

  it("uses lazy loading by default", async () => {
    const html = String(
      await Image({ alt: "x", height: 100, src: "a.jpg", width: 100 }),
    );

    expect(html).toContain('loading="lazy"');
  });

  it("uses eager loading when lazy is false", async () => {
    const html = String(
      await Image({
        alt: "x",
        height: 100,
        lazy: false,
        src: "a.jpg",
        width: 100,
      }),
    );

    expect(html).toContain('loading="eager"');
  });

  it("uses eager loading and high fetchpriority when priority is true", async () => {
    const html = String(
      await Image({
        alt: "x",
        height: 100,
        priority: true,
        src: "a.jpg",
        width: 100,
      }),
    );

    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchpriority="high"');
  });

  it("sets auto fetchpriority by default", async () => {
    const html = String(
      await Image({ alt: "x", height: 100, src: "a.jpg", width: 100 }),
    );

    expect(html).toContain('fetchpriority="auto"');
  });

  it("sets numeric containerWidth as px style on figure", async () => {
    const html = String(
      await Image({
        alt: "x",
        containerWidth: 640,
        height: 100,
        src: "a.jpg",
        width: 640,
      }),
    );

    expect(html).toContain("640px");
  });

  it("sets string containerWidth directly as style on figure", async () => {
    const html = String(
      await Image({
        alt: "x",
        containerWidth: "50%",
        height: 100,
        src: "a.jpg",
        width: 100,
      }),
    );

    expect(html).toContain("50%");
  });

  it("passes srcset to the img element", async () => {
    const srcset = "img-480.jpg 480w, img-800.jpg 800w";
    const html = String(
      await Image({ alt: "x", height: 100, src: "a.jpg", srcset, width: 100 }),
    );

    expect(html).toContain(srcset);
  });

  it("passes sizes to the img element", async () => {
    const sizes = "(max-width: 600px) 100vw, 50vw";
    const html = String(
      await Image({ alt: "x", height: 100, sizes, src: "a.jpg", width: 100 }),
    );

    expect(html).toContain(sizes);
  });
});
