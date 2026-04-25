import { describe, expect, it } from "vitest";

import { isPalindrome } from "./is-palindrome.js";

describe("isPalindrome", () => {
  it("should work", () => {
    expect(isPalindrome("abcdcba")).toBe(true);
  });
});
