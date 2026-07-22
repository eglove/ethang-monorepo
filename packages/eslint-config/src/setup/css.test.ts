import { describe, expect, it } from "vitest";

import { cssPlugin, unicornViewportPlugin } from "./css.ts";

describe("css", () => {
  describe("css plugin", () => {
    it("targets css files", () => {
      expect(cssPlugin.files).toBe("**/*.css");
    });
  });

  describe("unicorn viewporn plugin", () => {
    it("targets css files so the unicorn rule can run on css", () => {
      expect(unicornViewportPlugin.files).toBe("**/*.css");
    });

    it("uses the css language so css is parsed", () => {
      expect(unicornViewportPlugin.language).toBe("css/css");
    });

    it("registers the unicorn plugin for the css block", () => {
      expect(unicornViewportPlugin.pluginName).toBe("unicorn");
      expect(unicornViewportPlugin.pluginValue).toBe("unicorn");
    });

    it("enables prefer-explicit-viewport-units for css", () => {
      expect(unicornViewportPlugin.rules).toHaveProperty(
        "unicorn/prefer-explicit-viewport-units",
        "error"
      );
    });

    it("imports the unicorn plugin", () => {
      expect(unicornViewportPlugin.importString).toBe(
        'import unicorn from "eslint-plugin-unicorn";'
      );
    });
  });
});
