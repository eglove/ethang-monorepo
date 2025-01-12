import { describe, expect, it } from "vitest";

import { majorityElement, majorityElementSimple } from "./majority-element.js";

describe("majorityElement", () => {
  it.each([
    [[1, 2, 3, 2, 2, 1, 2], 2],
    [[5, 4, 3, 2, 1, 1, 1, 1, 1], 1],
  ])("should work", (list, result) => {
    expect(majorityElement(list)).toBe(result);
    expect(majorityElementSimple(list)).toBe(result);
  });
});
