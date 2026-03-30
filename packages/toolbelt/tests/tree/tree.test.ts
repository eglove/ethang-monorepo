import { describe, expect, it } from "vitest";

import { TreeNode } from "../../src/tree/tree-node.ts";
import { Tree } from "../../src/tree/tree.ts";

describe(TreeNode, () => {
  it("stores value and children", () => {
    const node = new TreeNode(42, null, null);

    expect(node.value).toBe(42);
    expect(node.left).toBeNull();
    expect(node.right).toBeNull();
  });
});

describe(Tree, () => {
  it("builds a level-order binary tree from an array", () => {
    const tree = new Tree([1, 2, 3, 4, 5]);

    expect(tree.root.value).toBe(1);
    expect(tree.root.left?.value).toBe(2);
    expect(tree.root.right?.value).toBe(3);
    expect(tree.root.left?.left?.value).toBe(4);
    expect(tree.root.left?.right?.value).toBe(5);
  });

  it("skips null values when building the tree", () => {
    const tree = new Tree([1, 2, null] as unknown as number[]);

    expect(tree.root.value).toBe(1);
    expect(tree.root.left?.value).toBe(2);
    expect(tree.root.right).toBeNull();
  });

  it("handles a single-element array", () => {
    const tree = new Tree([7]);

    expect(tree.root.value).toBe(7);
    expect(tree.root.left).toBeNull();
    expect(tree.root.right).toBeNull();
  });
});
