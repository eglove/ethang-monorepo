import every from "lodash/every.js";
import isArray from "lodash/isArray.js";
import isString from "lodash/isString.js";
import { describe, expect, it } from "vitest";

import {
  type ButtonSize,
  type ButtonVariant,
  getButtonClasses,
} from "./button-classes.ts";

const TEXT_WHITE = "text-white";

describe("getButtonClasses", () => {
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
      expect(classes).toContain("rounded-base");
    }
  });

  describe("variant classes", () => {
    it("default variant includes brand classes", () => {
      const classes = getButtonClasses("default");
      expect(classes).toContain("bg-brand");
      expect(classes).toContain(TEXT_WHITE);
    });

    it("secondary variant includes neutral classes", () => {
      const classes = getButtonClasses("secondary");
      expect(classes).toContain("bg-neutral-secondary-medium");
      expect(classes).toContain("text-body");
    });

    it("tertiary variant includes soft neutral classes", () => {
      const classes = getButtonClasses("tertiary");
      expect(classes).toContain("bg-neutral-primary-soft");
    });

    it("success variant includes success color classes", () => {
      const classes = getButtonClasses("success");
      expect(classes).toContain("bg-success");
      expect(classes).toContain(TEXT_WHITE);
    });

    it("danger variant includes danger color classes", () => {
      const classes = getButtonClasses("danger");
      expect(classes).toContain("bg-danger");
      expect(classes).toContain(TEXT_WHITE);
    });

    it("warning variant includes warning color classes", () => {
      const classes = getButtonClasses("warning");
      expect(classes).toContain("bg-warning");
      expect(classes).toContain(TEXT_WHITE);
    });

    it("dark variant includes dark color classes", () => {
      const classes = getButtonClasses("dark");
      expect(classes).toContain("bg-dark");
      expect(classes).toContain(TEXT_WHITE);
    });

    it("ghost variant includes transparent background", () => {
      const classes = getButtonClasses("ghost");
      expect(classes).toContain("bg-transparent");
      expect(classes).toContain("text-heading");
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
        expect(classes.length).toBe(unique.size);
      }
    }
  });
});
