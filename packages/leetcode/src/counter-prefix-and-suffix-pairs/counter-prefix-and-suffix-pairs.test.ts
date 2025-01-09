/* eslint-disable cspell/spellchecker */
import { describe, expect, it } from "vitest";

import { countPrefixSuffixPairs } from "./counter-prefix-and-suffix-pairs.ts";

describe("countPrefixSuffixPairs", () => {
  it.each([
    [["a", "aba", "ababa", "aa"], 4],
    [["pa", "papa", "ma", "mama"], 2],
    [["abab", "ab"], 0],
  ])("should work", (input, output) => {
    expect(countPrefixSuffixPairs(input)).toBe(output);
  });
});
