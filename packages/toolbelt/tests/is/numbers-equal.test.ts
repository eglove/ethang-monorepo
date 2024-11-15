import { describe, expect, it } from "vitest";

import { isNumbersEqual } from "../../src/is/numbers-equal.js";

describe("isNumbersEqual", () => {
  it.each([
    [0.3, 0.1 + 0.2, 1e-10, true],
    [0.5, 0.1 + 0.2, 1e-10, false],
    [1.4, 1.4, 0.2, true],
  ])(
    "should return correct values",

    (firstNumber, secondNumber, epsilon, expected) => {
      expect(isNumbersEqual(firstNumber, secondNumber, epsilon)).toBe(expected);
    },
  );
});
