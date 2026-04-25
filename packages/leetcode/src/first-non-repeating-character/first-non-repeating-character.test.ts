import { describe, expect, it } from "vitest";

import { firstNonRepeatingCharacter } from "./first-non-repeating-character.js";

describe("firstNonRepeatingCharacter", () => {
  it.each([
    // cspell:disable-next-line
    ["abcdcaf", 1],
    // cspell:disable-next-line
    ["faadabcbbebdf", 6],
  ])("should work", (string, expected) => {
    expect(firstNonRepeatingCharacter(string)).toBe(expected);
  });
});
