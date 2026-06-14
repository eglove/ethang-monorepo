import get from "lodash/get.js";
import isNil from "lodash/isNil.js";

import { TreeNode } from "./tree-node.js";

export class Tree<T> {
  public root: TreeNode<T>;

  public constructor(values: T[]) {
    this.root = this.buildTree(values);
  }

  private buildTree(values: T[]): TreeNode<T> {
    const firstValue = get(values, [0]);

    const root = new TreeNode(firstValue, null, null);
    const queue = [root];
    let index = 1;

    while (index < values.length) {
      const current = queue.shift();

      if (isNil(current)) {
        break;
      }

      const leftValue = values[index];

      if (!isNil(leftValue)) {
        current.left = new TreeNode(leftValue, null, null);
        queue.push(current.left);
      }
      index += 1;

      if (index < values.length) {
        const rightValue = values[index];

        if (!isNil(rightValue)) {
          current.right = new TreeNode(rightValue, null, null);
          queue.push(current.right);
        }
        index += 1;
      }
    }

    return root;
  }
}
