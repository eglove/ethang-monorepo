import { describe, expect, it } from "vitest";

import { minimumAreaRectangle } from "./minimum-area-rectangle.js";

const points: [number, number][] = [
  [1, 5],
  [5, 1],
  [4, 2],
  [2, 4],
  [2, 2],
  [1, 2],
  [4, 5],
  [2, 5],
  [-1, -2],
];

describe("minimumAreaRectangle", () => {
  it("should work", () => {
    expect(minimumAreaRectangle(points)).toBe(3);
  });
});
