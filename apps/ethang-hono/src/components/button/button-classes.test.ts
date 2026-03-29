import every from "lodash/every.js";
import isArray from "lodash/isArray.js";
import isString from "lodash/isString.js";
import { describe, expect, it } from "vitest";

import {
  type ButtonSize,
  type ButtonVariant,
  getButtonClasses,
} from "./button-classes.ts";

describe(getButtonClasses, () => {
  const variants: ButtonVariant[] = [
    "danger",
    "dark",
    "default",
    "ghost",
    "secondary",
    "success",
    "tertiary",
    "warning",
  ];

  it("returns an array of strings", () => {
    const result = getButtonClasses("default");

    expect(isArray(result)).toBe(true);
    expect(every(result, isString)).toBe(true);
  });

  it("always includes base classes", () => {
    for (const variant of variants) {
      const classes = getButtonClasses(variant);

      expect(classes).toContain("border");
      expect(classes).toContain("cursor-pointer");
      expect(classes).toContain("font-medium");
      expect(classes).toContain("rounded-lg");
    }
  });

  describe("variant classes", () => {
    it("default variant includes sky tinted classes", () => {
      const classes = getButtonClasses("default");

      expect(classes).toContain("bg-sky-300/10");
      expect(classes).toContain("border-sky-300/30");
      expect(classes).toContain("text-sky-300");
    });

    it("secondary variant includes neutral classes", () => {
      const classes = getButtonClasses("secondary");

      expect(classes).toContain("bg-slate-700");
      expect(classes).toContain("text-slate-200");
    });

    it("tertiary variant includes soft neutral classes", () => {
      const classes = getButtonClasses("tertiary");

      expect(classes).toContain("bg-slate-800");
    });

    it("success variant includes success tinted classes", () => {
      const classes = getButtonClasses("success");

      expect(classes).toContain("bg-green-400/10");
      expect(classes).toContain("border-green-400/30");
      expect(classes).toContain("text-green-400");
    });

    it("danger variant includes danger tinted classes", () => {
      const classes = getButtonClasses("danger");

      expect(classes).toContain("bg-red-400/10");
      expect(classes).toContain("border-red-400/30");
      expect(classes).toContain("text-red-400");
    });

    it("warning variant includes warning tinted classes", () => {
      const classes = getButtonClasses("warning");

      expect(classes).toContain("bg-amber-400/10");
      expect(classes).toContain("border-amber-400/30");
      expect(classes).toContain("text-amber-400");
    });

    it("dark variant includes dark depth classes", () => {
      const classes = getButtonClasses("dark");

      expect(classes).toContain("bg-slate-900");
      expect(classes).toContain("text-slate-100");
    });

    it("ghost variant includes transparent background and slate text", () => {
      const classes = getButtonClasses("ghost");

      expect(classes).toContain("bg-transparent");
      expect(classes).toContain("text-slate-200");
    });
  });

  describe("size classes", () => {
    it("base size uses default classes only", () => {
      const base = getButtonClasses("default", "base");

      expect(base).not.toContain("px-5");
      expect(base).not.toContain("px-6");
      expect(base).not.toContain("text-base");
    });

    it("sm size adds small padding and font", () => {
      const classes = getButtonClasses("default", "sm");

      expect(classes).toContain("px-3");
      expect(classes).toContain("py-2");
    });

    it("lg size adds large padding and removes leading-5", () => {
      const classes = getButtonClasses("default", "lg");

      expect(classes).toContain("px-5");
      expect(classes).toContain("py-3");
      expect(classes).toContain("text-base");
      expect(classes).not.toContain("leading-5");
    });

    it("xl size adds extra-large padding and removes leading-5", () => {
      const classes = getButtonClasses("default", "xl");

      expect(classes).toContain("px-6");
      expect(classes).toContain("py-3.5");
      expect(classes).toContain("text-base");
      expect(classes).not.toContain("leading-5");
    });

    it("xs size adds extra-small padding", () => {
      const classes = getButtonClasses("default", "xs");

      expect(classes).toContain("px-3");
      expect(classes).toContain("py-1.5");
      expect(classes).toContain("text-xs");
    });
  });

  it("returns unique class names (no duplicates)", () => {
    const sizes: ButtonSize[] = ["base", "lg", "sm", "xl", "xs"];
    for (const variant of variants) {
      for (const size of sizes) {
        const classes = getButtonClasses(variant, size);
        const unique = new Set(classes);

        expect(classes).toHaveLength(unique.size);
      }
    }
  });
});
