import type { TreeNode } from "@ethang/toolbelt/tree/tree-node.js";

import isNil from "lodash/isNil.js";

const calculateBranchSums = (
  node: null | TreeNode<number>,
  runningSum: number,
  sums: number[],
) => {
  if (isNil(node)) {
    return;
  }

  const newRunningSum = runningSum + node.value;

  if (isNil(node.left) && isNil(node.right)) {
    sums.push(newRunningSum);
    return;
  }

  calculateBranchSums(node.left, newRunningSum, sums);
  calculateBranchSums(node.right, newRunningSum, sums);
};

export const branchSums = (root: TreeNode<number>) => {
  const sums: number[] = [];
  calculateBranchSums(root, 0, sums);

  return sums;
};
