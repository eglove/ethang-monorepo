import { describe, expect, it } from "vitest";

import { bestSeat } from "./best-seat.js";

describe("bestSeat", () => {
  it("should work", () => {
    expect(bestSeat([1, 0, 1, 0, 0, 0, 1])).toBe(4);
  });

  it("should return -1 if no seats available", () => {
    expect(bestSeat([1])).toBe(-1);
  });
});
