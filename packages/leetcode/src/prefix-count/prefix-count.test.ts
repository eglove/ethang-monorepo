import { describe, expect, it } from "vitest";

import { prefixCount } from "./prefix-count.ts";

describe("prefixCount", () => {
  it.each([
    [["pay", "attention", "practice", "attend"], "at", 2],
    [["leetcode", "win", "loops", "success"], "code", 0],
  ])("should work", (words, pref, result) => {
    expect(prefixCount(words, pref)).toBe(result);
  });
});
