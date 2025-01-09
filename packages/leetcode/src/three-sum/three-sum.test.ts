import { describe, expect, it } from "vitest";

import { threeSum } from "./three-sum.ts";

describe("threeSum", () => {
  it.each([
    [[-1, 0, 1, 2, -1, -4], [[-1, -1, 2], [-1, 0, 1]]],
    [[0, 1, 1], []],
    [[0, 0, 0], [[0, 0, 0]]],
  ])("should work", (input, output) => {
    expect(threeSum(input)).toStrictEqual(output);
  });
});
