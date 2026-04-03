import { describe, expect, it } from "vitest";

import { quorum } from "./quorum.js";

describe("quorum formula ceil(2n/3)", () => {
  it("should return 1 for n=1", () => {
    expect(quorum(1)).toBe(1);
  });

  it("should return 2 for n=2 (unanimity)", () => {
    expect(quorum(2)).toBe(2);
  });

  it("should return 2 for n=3", () => {
    expect(quorum(3)).toBe(2);
  });

  it("should return 6 for n=8", () => {
    expect(quorum(8)).toBe(6);
  });

  it("should return 6 for n=9", () => {
    expect(quorum(9)).toBe(6);
  });

  it("should throw for n=0 (floor guard)", () => {
    expect(() => {
      quorum(0);
    }).toThrow();
  });

  it("should throw for negative n", () => {
    expect(() => {
      quorum(-1);
    }).toThrow();
  });
});
