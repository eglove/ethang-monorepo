import { Tree } from "@ethang/toolbelt/tree/tree.js";
import { describe, expect, it } from "vitest";

import { nodeDepths, nodeDepthsRecursive } from "./node-depths.js";

describe("nodeDepths", () => {
  it("should work", () => {
    const tree = new Tree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    expect(nodeDepths(tree.root)).toBe(19);
  });

  it("should work with recursive solution", () => {
    const tree = new Tree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    expect(nodeDepthsRecursive(tree.root)).toBe(19);
  });

  it("should return 0 when root is null/nil", () => {
    expect(nodeDepthsRecursive(null)).toBe(0);
  });
});
