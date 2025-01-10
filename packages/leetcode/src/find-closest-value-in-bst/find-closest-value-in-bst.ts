import type { TreeNode } from "@ethang/toolbelt/src/tree/tree-node.js";

const findClosestValueInBstHelper = (
  tree: null | TreeNode<number>, target: number, closestValue: number,
) => {
  let currentNode = tree;
  let currentClosestValue = closestValue;

  while (null !== currentNode) {
    if (
      Math.abs(target - closestValue) > Math.abs(target - currentNode.value)
    ) {
      currentClosestValue = currentNode.value;
    }

    if (target < currentNode.value) {
      currentNode = currentNode.left;
    } else if (target > currentNode.value) {
      currentNode = currentNode.right;
    } else {
      break;
    }
  }

  return currentClosestValue;
};

export const findClosestValueInBst = (
  tree: TreeNode<number>, target: number,
) => {
  return findClosestValueInBstHelper(tree, target, tree.value);
};

