import { describe, expect, it } from "vitest";

import { AccordionBody } from "./accordion-body.tsx";
import { AccordionHeader } from "./accordion-header.tsx";
import { AccordionWrapper } from "./accordion-wrapper.tsx";

describe("AccordionBody", () => {
  it("renders a div with the given bodyId", async () => {
    const html = String(
      await AccordionBody({
        bodyId: "body-1",
        children: "Content",
        headingId: "heading-1",
      }),
    );
    expect(html).toContain('id="body-1"');
  });

  it("renders aria-labelledby with headingId", async () => {
    const html = String(
      await AccordionBody({
        bodyId: "body-1",
        children: "Content",
        headingId: "heading-1",
      }),
    );
    expect(html).toContain('aria-labelledby="heading-1"');
  });

  it("renders children content", async () => {
    const html = String(
      await AccordionBody({
        bodyId: "b",
        children: "My content",
        headingId: "h",
      }),
    );
    expect(html).toContain("My content");
  });
});

describe("AccordionHeader", () => {
  it("renders h2 with headingId", async () => {
    const html = String(
      await AccordionHeader({
        bodyId: "body-1",
        children: "Title",
        headingId: "heading-1",
      }),
    );
    expect(html).toContain("<h2");
    expect(html).toContain('id="heading-1"');
  });

  it("renders button with aria-controls pointing to bodyId", async () => {
    const html = String(
      await AccordionHeader({
        bodyId: "body-1",
        children: "Title",
        headingId: "heading-1",
      }),
    );
    expect(html).toContain('aria-controls="body-1"');
  });

  it("renders children as button label", async () => {
    const html = String(
      await AccordionHeader({
        bodyId: "b",
        children: "Section Title",
        headingId: "h",
      }),
    );
    expect(html).toContain("Section Title");
  });

  it("applies optional childrenWrapper className", async () => {
    const html = String(
      await AccordionHeader({
        bodyId: "b",
        children: "x",
        classNames: { childrenWrapper: "text-brand" },
        headingId: "h",
      }),
    );
    expect(html).toContain("text-brand");
  });
});

describe("AccordionWrapper", () => {
  it("renders a div with data-accordion attribute", async () => {
    const html = String(await AccordionWrapper({ children: "content" }));
    expect(html).toContain('data-accordion="collapse"');
  });

  it("renders children inside the wrapper", async () => {
    const html = String(await AccordionWrapper({ children: "Inner Content" }));
    expect(html).toContain("Inner Content");
  });

  it("generates a unique id with accordion- prefix", async () => {
    const html = String(await AccordionWrapper({ children: "" }));
    expect(html).toMatch(/id="accordion-[\da-f-]+"/u);
  });
});
