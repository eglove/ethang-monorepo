import { describe, expect, it } from "vitest";

import { isPalindrome } from "./is-palindrome.js";

describe("isPalindrome", () => {
  it("should work", () => {
    // eslint-disable-next-line cspell/spellchecker
    expect(isPalindrome("abcdcba")).toBe(true);
  });
});
