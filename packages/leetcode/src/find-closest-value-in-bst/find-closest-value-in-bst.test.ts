import { Tree } from "@ethang/toolbelt/src/tree/tree.ts";
import { describe, expect, it } from "vitest";

import { findClosestValueInBst } from "./find-closest-value-in-bst.js";

describe("findClosestValueInBst", () => {
  it("should work", () => {
    const bst = new Tree([10, 15, 22, 13, 14, 5, 5, 2, 1].sort((a, b) => {
      return a - b;
    }));

    expect(findClosestValueInBst(bst.root, 11)).toBe(14);
  });
});
