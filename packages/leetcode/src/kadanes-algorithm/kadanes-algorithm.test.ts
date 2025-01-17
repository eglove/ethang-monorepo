import { describe, expect, it } from "vitest";

import { kadanesAlgorithm } from "./kadanes-algorithm.js";

// eslint-disable-next-line cspell/spellchecker
describe("kadanesAlgorithm", () => {
  it("should work", () => {
    expect(kadanesAlgorithm([
      3, 5, -9, 1, 3, -2, 3, 4, 7, 2, -9, 6, 3, 1, -5, 4,
    ])).toBe(19);
  });
});
