import { Tree } from "@ethang/toolbelt/src/tree/tree.js";
import { describe, expect, it } from "vitest";

import { branchSums } from "./branch-sums.js";

describe("branchSums", () => {
  it("should work", () => {
    const tree = new Tree([1, 2, 4, 5, 3, 6, 7, 8, 9, 10]);

    // Not actually correct because tree impl isn't balanced
    expect(branchSums(tree.root)).toStrictEqual([10, 52]);
  });
});
