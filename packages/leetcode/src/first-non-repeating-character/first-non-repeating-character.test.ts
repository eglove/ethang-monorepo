/* eslint-disable cspell/spellchecker */
import { describe, expect, it } from "vitest";

import { firstNonRepeatingCharacter } from "./first-non-repeating-character.js";

describe("firstNonRepeatingCharacter", () => {
  it.each([
    ["abcdcaf", 1],
    ["faadabcbbebdf", 6],
  ])("should work", (string, expected) => {
    expect(firstNonRepeatingCharacter(string)).toBe(expected);
  });
});
