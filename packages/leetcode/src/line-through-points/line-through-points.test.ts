import { describe, expect, it } from "vitest";

import { lineThroughPoints } from "./line-through-points.js";

const points: [number, number][] = [
  [1, 1],
  [2, 2],
  [3, 3],
  [0, 4],
  [-2, 6],
  [4, 0],
  [2, 1],
];

describe("lineThroughPoints", () => {
  it("should work", () => {
    expect(lineThroughPoints(points)).toBe(4);
  });
});
