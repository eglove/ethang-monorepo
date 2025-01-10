import isNil from "lodash/isNil.js";

import { TreeNode } from "./tree-node.js";

export class Tree<T,> {
  public root!: TreeNode<T>;

  public constructor(values: T[]) {
    this.insertMany(values);
  }

  private insert(value: T) {
    const insertNode = (
      node: null | TreeNode<T>,
      newValue: T,
    ): TreeNode<T> => {
      if (isNil(node)) {
        return new TreeNode<T>(newValue, null, null);
      }

      if (newValue < node.value) {
        node.left = insertNode(node.left, newValue);
      } else {
        node.right = insertNode(node.right, newValue);
      }

      return node;
    };

    this.root = insertNode(this.root, value);
  }

  private insertMany(values: T[]) {
    for (const value of values) {
      this.insert(value);
    }
  }
}
