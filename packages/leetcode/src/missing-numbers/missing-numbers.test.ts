import { describe, expect, it } from "vitest";

import {
  missingNumberBitwise,
  missingNumbers,
  missingNumbersMathTrick,
  missingNumbersSet,
} from "./missing-numbers.js";

describe("missingNumbers", () => {
  it("should work", () => {
    expect(missingNumbers([1, 4, 3, 5])).toStrictEqual([2, 6]);
  });

  it("should work with set", () => {
    expect(missingNumbersSet([1, 4, 3, 5])).toStrictEqual([2, 6]);
  });

  it("should work with math trick", () => {
    expect(missingNumbersMathTrick([1, 4, 3, 5])).toStrictEqual([2, 6]);
  });

  it("should work with math bitwise", () => {
    expect(missingNumberBitwise([1, 4, 3, 5])).toStrictEqual([2, 6]);
  });
});
