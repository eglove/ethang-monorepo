import { describe, expect, it } from "vitest";

import { isBrowser } from "../../src/is/browser.ts";

describe("isBrowser", () => {
  it("should return false for server environment", () => {
    expect(isBrowser).toBe(false);
  });
});
