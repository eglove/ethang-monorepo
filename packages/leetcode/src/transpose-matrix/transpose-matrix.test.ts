import { describe, expect, it } from "vitest";

import { transposeMatrix } from "./transpose-matrix.ts";

const sample = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

const result = [
  [1, 4, 7],
  [2, 5, 8],
  [3, 6, 9],
];

describe("transposeMatrix", () => {
  it("should work", () => {
    expect(transposeMatrix(sample)).toStrictEqual(result);
  });
});
