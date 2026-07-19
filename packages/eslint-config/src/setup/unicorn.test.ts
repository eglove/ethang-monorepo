import { describe, expect, it } from "vitest";

import { unicornRules } from "./unicorn.ts";

describe("unicorn", () => {
  describe("unicorn rules", () => {
    it("turns off prefer-explicit-viewport-units for js/ts files", () => {
      expect(unicornRules["unicorn/prefer-explicit-viewport-units"]).toBe(
        "off"
      );
    });
  });
});
