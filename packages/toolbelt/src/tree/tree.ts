import get from "lodash/get.js";
import isNil from "lodash/isNil.js";

import { TreeNode } from "./tree-node.js";

export class Tree<T,> {
  public root: TreeNode<T>;

  public constructor(values: T[]) {
    this.root = this.buildTree(values);
  }

  private buildTree(values: T[]): TreeNode<T> {
    const firstValue = get(values, [0]);

    const root = new TreeNode<T>(firstValue, null, null);
    const queue = [root];
    let index = 1;

    while (index < values.length) {
      const current = queue.shift();

      if (isNil(current)) {
        break;
      }

      if (index < values.length) {
        const value = values[index];

        if (!isNil(value)) {
          current.left = new TreeNode<T>(value, null, null);
          index += 1;
          queue.push(current.left);
        }
      }

      if (index < values.length) {
        const value = values[index];

        if (!isNil(value)) {
          current.right = new TreeNode<T>(value, null, null);
          index += 1;
          queue.push(current.right);
        }
      }
    }

    return root;
  }
}
