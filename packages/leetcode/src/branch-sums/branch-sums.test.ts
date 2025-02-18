import { Tree } from "@ethang/toolbelt/tree/tree.js";
import { describe, expect, it } from "vitest";

import { branchSums } from "./branch-sums.js";

describe("branchSums", () => {
  it("should work", () => {
    const tree = new Tree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    expect(branchSums(tree.root)).toStrictEqual([15, 16, 18, 10, 11]);
  });
});
