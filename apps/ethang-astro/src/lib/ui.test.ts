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
  pageClasses,
  paginationEdgeClass,
  paginationNumberClass,
  sanitizeCodeLanguage,
  underlineLinkBase
} from "./ui.ts";

describe("class constants", () => {
  it.each([
    {
      expected: "mx-auto max-w-7xl px-4 py-6",
      name: "page container",
      value: pageClasses
    },
    {
      expected:
        "border border-night-owl-border rounded-xl bg-night-owl-surface",
      name: "card surface",
      value: cardBase
    },
    {
      expected:
        "border border-night-owl-border rounded-xl bg-night-owl-surface/50 backdrop-blur-md",
      name: "tinted card",
      value: cardTintBase
    },
    {
      expected: "font-semibold text-night-owl-fg",
      name: "heading base",
      value: headingBase
    },
    {
      expected:
        "rounded-lg border border-night-owl-border bg-night-owl-bg/80 px-3 py-2 text-night-owl-fg focus:border-primary transition-colors outline-none",
      name: "text input",
      value: inputBase
    },
    {
      expected: "text-xs font-bold text-night-owl-muted uppercase",
      name: "field label",
      value: labelBase
    },
    {
      expected: "text-primary hover:underline",
      name: "inline link",
      value: inlineLinkBase
    },
    {
      expected: "border-l-4 border-primary pl-4 my-4 italic text-night-owl-fg",
      name: "blockquote",
      value: blockquoteBase
    },
    {
      expected: "text-night-owl-fg hover:text-primary transition-colors",
      name: "nav link",
      value: navLinkBase
    },
    {
      expected: "hover:text-primary hover:underline transition-colors",
      name: "underline link",
      value: underlineLinkBase
    }
  ])("$name carries the shared Tailwind tokens", ({ expected, value }) => {
    expect(value).toBe(expected);
  });
});

describe("mergeClass", () => {
  it("returns the base untouched when no extra class is given", () => {
    expect(mergeClass(pageClasses, "")).toBe(pageClasses);
  });

  it("appends an extra class to the base", () => {
    expect(mergeClass(cardBase, "p-5")).toBe(
      "border border-night-owl-border rounded-xl bg-night-owl-surface p-5"
    );
  });
});

describe("buttonClasses", () => {
  it.each([
    {
      expected:
        "cursor-pointer bg-primary/20 hover:bg-primary/30 text-primary font-semibold transition-colors px-4 py-2 rounded-lg",
      name: "primary",
      size: "md",
      variant: "primary"
    },
    {
      expected:
        "cursor-pointer bg-danger/20 hover:bg-danger/30 text-danger font-semibold transition-colors px-3 py-1.5 rounded-md text-sm",
      name: "danger",
      size: "sm",
      variant: "danger"
    },
    {
      expected:
        "cursor-pointer border border-night-owl-border text-night-owl-muted hover:text-primary transition-colors px-2 py-1 rounded-md text-xs",
      name: "outline",
      size: "xs",
      variant: "outline"
    },
    {
      expected:
        "cursor-pointer bg-gradient-to-r from-primary to-accent text-on-primary font-semibold shadow-lg transition-all hover:opacity-90 active:scale-95 px-4 py-2 rounded-lg",
      name: "gradient",
      size: "md",
      variant: "gradient"
    },
    {
      expected:
        "cursor-pointer text-night-owl-muted hover:text-red-400 transition-colors px-2 py-1 rounded-md text-xs",
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
