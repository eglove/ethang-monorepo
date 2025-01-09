import { describe, expect, it } from "vitest";

import { isMatch, isMatchNoRecursion } from "./regular-expression-matching.ts";

const testCases = [
  ["aa", "a", false],
  ["aa", "a*", true],
  ["ab", ".*", true],
  ["aab", "c*a*b", true],
] as const;

describe("regularExpressionMatching", () => {
  it.each(testCases)("should work", (s, p, result) => {
    expect(isMatch(s, p)).toBe(result);
  });

  it.each(testCases)("should work without recursion", (s, p, result) => {
    expect(isMatchNoRecursion(s, p)).toBe(result);
  });
});
