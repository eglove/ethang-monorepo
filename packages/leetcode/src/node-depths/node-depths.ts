import type { TreeNode } from "@ethang/toolbelt/tree/tree-node.js";

import isNil from "lodash/isNil.js";

export const nodeDepths = (root: TreeNode<number>) => {
  let sumOfDepths = 0;
  const stack: {
    depth: number;
    node: null | TreeNode<number>;
  }[] = [
    {
      depth: 0,
      node: root,
    },
  ];

  while (0 < stack.length) {
    const nodeInfo = stack.pop();

    if (isNil(nodeInfo?.node)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    sumOfDepths += nodeInfo.depth;
    stack.push(
      {
        depth: nodeInfo.depth + 1,
        node: nodeInfo.node.left,
      },
      {
        depth: nodeInfo.depth + 1,
        node: nodeInfo.node.right,
      },
    );
  }

  return sumOfDepths;
};

export const nodeDepthsRecursive = (
  root: null | TreeNode<number>,
  depth = 0,
): number => {
  if (isNil(root)) {
    return 0;
  }

  return (
    depth +
    nodeDepthsRecursive(root.left ?? null, depth + 1) +
    nodeDepthsRecursive(root.right ?? null, depth + 1)
  );
};
