import { describe, expect, it } from "vitest";

import { cssPlugin, unicornCssPlugin } from "./css.ts";

describe("css", () => {
  describe("css plugin", () => {
    it("targets css files", () => {
      expect(cssPlugin.files).toBe("**/*.css");
    });
  });

  describe("unicorn css plugin", () => {
    it("targets css files so the unicorn rules can run on css", () => {
      expect(unicornCssPlugin.files).toBe("**/*.css");
    });

    it("uses the css language so css is parsed", () => {
      expect(unicornCssPlugin.language).toBe("css/css");
    });

    it("registers the unicorn plugin for the css block", () => {
      expect(unicornCssPlugin.pluginName).toBe("unicorn");
      expect(unicornCssPlugin.pluginValue).toBe("unicorn");
    });

    it("imports the unicorn plugin", () => {
      expect(unicornCssPlugin.importString).toBe(
        'import unicorn from "eslint-plugin-unicorn";'
      );
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
      "prefer-explicit-viewport-units",
      "prefer-media-feature-range-syntax"
    ])("enables unicorn/%s for css files", (ruleName) => {
      expect(unicornCssPlugin.rules).toHaveProperty(
        `unicorn/${ruleName}`,
        "error"
      );
    });
  });
});
