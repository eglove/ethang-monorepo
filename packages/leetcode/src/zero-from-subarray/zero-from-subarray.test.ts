import { describe, expect, it } from "vitest";

import { zeroFromSubarray } from "./zero-from-subarray.js";

describe("zeroFromSubarray", () => {
  it.each([
    [[4, -3, 2, 4, -1, -5, 7], true],
    [[2, -2], true],
  ])("should work", (list, result) => {
    expect(zeroFromSubarray(list)).toBe(result);
  });
});
