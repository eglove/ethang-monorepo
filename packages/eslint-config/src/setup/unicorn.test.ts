import { describe, expect, it } from "vitest";

import { unicornRules } from "./unicorn.ts";

describe("unicorn", () => {
  describe("unicorn rules", () => {
    it("turns off prefer-explicit-viewport-units for js/ts files", () => {
      expect(unicornRules["unicorn/prefer-explicit-viewport-units"]).toBe(
        "off"
      );
    });

    it("turns off prefer-continue because it conflicts with core no-continue", () => {
      expect(unicornRules["unicorn/prefer-continue"]).toBe("off");
    });

    it.each([
      "no-deprecated-css-features",
      "no-duplicate-css-selectors",
      "no-duplicate-font-family-names",
      "no-invalid-media-features",
      "no-nesting-with-mixed-specificity",
      "no-redundant-nested-style-rules",
      "no-unknown-css-annotations",
      "no-unknown-pseudo-selectors",
      "no-unscoped-css-nesting-selector",
      "prefer-media-feature-range-syntax"
    ])(
      "turns off %s for js/ts files (css-only since unicorn 76)",
      (ruleName) => {
        expect(unicornRules[`unicorn/${ruleName}`]).toBe("off");
      }
    );
  });
});
