import { describe, expect, it } from "vitest";

import { isPalindrome } from "./is-palindrome.js";

describe("isPalindrome", () => {
  it("should work", () => {
    // cspell:disable-next-line
    expect(isPalindrome("abcdcba")).toBe(true);
  });
});
