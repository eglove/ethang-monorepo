import { describe, expect, it } from "vitest";

import {
  blockquoteBase,
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
  cardBase,
  cardTintBase,
  headingBase,
  inlineLinkBase,
  inputBase,
  labelBase,
  mergeClass,
  navLinkBase,
  navLinkClass,
  pageClasses,
  paginationEdgeClass,
  paginationNumberClass,
  sanitizeCodeLanguage,
  underlineLinkBase
} from "./ui.ts";

describe("class constants", () => {
  it.each([
    {
      expected: "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8",
      name: "page container",
      value: pageClasses
    },
    {
      expected:
        "surface-card border border-night-owl-border bg-night-owl-surface",
      name: "card surface",
      value: cardBase
    },
    {
      expected:
        "surface-card surface-card-tint border border-night-owl-border bg-night-owl-surface/80 backdrop-blur-md",
      name: "tinted card",
      value: cardTintBase
    },
    {
      expected: "font-semibold tracking-tight text-night-owl-fg",
      name: "heading base",
      value: headingBase
    },
    {
      expected:
        "w-full rounded-md border border-night-owl-border bg-night-owl-bg/80 px-3 py-2 text-night-owl-fg placeholder:text-night-owl-muted focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors outline-none",
      name: "text input",
      value: inputBase
    },
    {
      expected:
        "text-xs font-bold tracking-[0.16em] text-night-owl-muted uppercase",
      name: "field label",
      value: labelBase
    },
    {
      expected:
        "font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary",
      name: "inline link",
      value: inlineLinkBase
    },
    {
      expected: "border-l-4 border-primary pl-4 my-4 italic text-night-owl-fg",
      name: "blockquote",
      value: blockquoteBase
    },
    {
      expected:
        "relative font-medium text-night-owl-fg transition-colors hover:text-primary",
      name: "nav link",
      value: navLinkBase
    },
    {
      expected:
        "font-medium text-night-owl-fg underline decoration-night-owl-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary",
      name: "underline link",
      value: underlineLinkBase
    }
  ])("$name carries the shared Tailwind tokens", ({ expected, value }) => {
    expect(value).toBe(expected);
  });
});

describe("navLinkClass", () => {
  it.each([
    {
      active: true,
      expected:
        "relative font-medium text-primary transition-colors after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:bg-primary"
    },
    {
      active: false,
      expected:
        "relative font-medium text-night-owl-fg transition-colors hover:text-primary"
    }
  ])("returns the correct visual state", ({ active, expected }) => {
    expect(navLinkClass(active)).toBe(expected);
  });
});

describe("mergeClass", () => {
  it("returns the base untouched when no extra class is given", () => {
    expect(mergeClass(pageClasses, "")).toBe(pageClasses);
  });

  it("appends an extra class to the base", () => {
    expect(mergeClass(cardBase, "p-5")).toBe(
      "surface-card border border-night-owl-border bg-night-owl-surface p-5"
    );
  });
});

describe("buttonClasses", () => {
  it.each([
    {
      expected:
        "cursor-pointer bg-primary text-on-primary font-semibold shadow-sm transition-all hover:bg-secondary active:scale-[0.98] px-4 py-2 rounded-md",
      name: "primary",
      size: "md",
      variant: "primary"
    },
    {
      expected:
        "cursor-pointer bg-danger text-on-primary font-semibold transition-colors hover:bg-danger/80 px-3 py-1.5 rounded-md text-sm",
      name: "danger",
      size: "sm",
      variant: "danger"
    },
    {
      expected:
        "cursor-pointer border border-night-owl-border bg-night-owl-surface/50 text-night-owl-fg hover:border-primary hover:text-primary transition-colors px-2 py-1 rounded-md text-xs",
      name: "outline",
      size: "xs",
      variant: "outline"
    },
    {
      expected:
        "cursor-pointer bg-gradient-to-r from-primary to-accent text-on-primary font-semibold shadow-lg transition-all hover:brightness-110 active:scale-[0.98] px-4 py-2 rounded-md",
      name: "gradient",
      size: "md",
      variant: "gradient"
    },
    {
      expected:
        "cursor-pointer text-night-owl-muted hover:text-danger transition-colors px-2 py-1 rounded-md text-xs",
      name: "ghost",
      size: "xs",
      variant: "ghost"
    }
  ])("composes the $name variant", ({ expected, size, variant }) => {
    expect(buttonClasses(variant as ButtonVariant, size as ButtonSize)).toBe(
      expected
    );
  });
});

describe("pagination classes", () => {
  it("renders a disabled edge", () => {
    expect(paginationEdgeClass(true)).toBe(
      "px-3 py-1.5 rounded-md border border-night-owl-border text-night-owl-muted text-sm cursor-not-allowed opacity-50"
    );
  });

  it("renders an enabled edge", () => {
    expect(paginationEdgeClass(false)).toBe(
      "px-3 py-1.5 rounded-md border border-night-owl-border text-night-owl-fg hover:text-primary hover:border-primary transition-colors text-sm"
    );
  });

  it("renders the active page number", () => {
    expect(paginationNumberClass(true)).toBe(
      "px-3 py-1.5 rounded-md border transition-colors text-sm bg-primary/20 border-primary text-primary font-semibold"
    );
  });

  it("renders an inactive page number", () => {
    expect(paginationNumberClass(false)).toBe(
      "px-3 py-1.5 rounded-md border transition-colors text-sm border-night-owl-border text-night-owl-fg hover:text-primary hover:border-primary"
    );
  });
});

describe("sanitizeCodeLanguage", () => {
  it.each([
    { expected: "ts", input: "ts", name: "keeps a bundled alias" },
    { expected: "typescript", input: "typescript", name: "keeps a bundled id" },
    { expected: "html", input: "html", name: "keeps html" },
    {
      expected: "plaintext",
      input: "plaintext",
      name: "falls back to plaintext for a non-bundled key"
    },
    {
      expected: "plaintext",
      input: "klingon",
      name: "falls back for an unknown language"
    },

    { expected: "plaintext", input: null, name: "falls back when null" },
    { expected: "plaintext", input: "", name: "falls back when empty" }
  ])("$name", ({ expected, input }) => {
    expect(sanitizeCodeLanguage(input)).toBe(expected);
  });
});
