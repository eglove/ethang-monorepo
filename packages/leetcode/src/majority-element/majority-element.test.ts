import { describe, expect, it } from "vitest";

import { majorityElement, majorityElementSimple } from "./majority-element.js";

describe("majorityElement", () => {
  it.each([
    { expected: 2, list: [1, 2, 3, 2, 2, 1, 2] },
    { expected: 1, list: [5, 4, 3, 2, 1, 1, 1, 1, 1] },
    { expected: null, list: [1, 2, 3] },
    { expected: null, list: [] }
  ])(
    "should find majority element for $list as $expected",
    ({ expected, list }) => {
      expect(majorityElement(list)).toBe(expected);
    }
  );

  it.each([
    { expected: 2, list: [1, 2, 3, 2, 2, 1, 2] },
    { expected: 1, list: [5, 4, 3, 2, 1, 1, 1, 1, 1] },
    { expected: 3, list: [1, 2, 3] },
    { expected: null, list: [] }
  ])(
    "should run simple Boyer-Moore algorithm on $list to get $expected",
    ({ expected, list }) => {
      expect(majorityElementSimple(list)).toBe(expected);
    }
  );
});
