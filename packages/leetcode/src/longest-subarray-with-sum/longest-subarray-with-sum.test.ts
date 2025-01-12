import { describe, expect, it } from "vitest";

import { longestSubarrayWithSum } from "./longest-subarray-with-sum.js";

describe("longestSubarrayWithSum", () => {
  it("should work", () => {
    expect(longestSubarrayWithSum([1, 2, 3, 4, 3, 3, 1, 2, 1, 2], 10))
      .toStrictEqual([4, 8]);
  });
});
