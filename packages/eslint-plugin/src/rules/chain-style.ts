import {
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import { isLodashCall } from "../utils/ast.ts";
import {
  isChainable,
  isChainBreaker,
  isExplicitChainStart,
  isMethodCall
} from "../utils/chain.ts";
import { isCallExpression } from "../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

export type ChainStyleContext = TSESLint.RuleContext<MessageIds, Options>;

type ChainStyle = "as-needed" | "explicit" | "implicit";

type MessageIds = "noExplicit" | "noImplicit" | "unnecessary";

type Options = [ChainStyle?];

export const getParentCall = (node: TSESTree.Node) => {
  const { parent } = node;

  if (isNil(parent)) {
    return null;
  }

  const grandParent = parent.parent;

  if (isNil(grandParent)) {
    return null;
  }

  if (isCallExpression(grandParent) && isMethodCall(grandParent)) {
    return grandParent;
  }

  return null;
};

export const reportAsNeeded = (
  node: TSESTree.CallExpression,
  context: ChainStyleContext
) => {
  if (!isExplicitChainStart(node)) {
    return;
  }

  let current = getParentCall(node);
  let isNeeded = false;

  while (!isNil(current) && isMethodCall(current) && !isChainBreaker(current)) {
    if (!isChainable(current)) {
      isNeeded = true;
    }

    current = getParentCall(current);
  }

  if (!isNeeded && !isNil(current) && isMethodCall(current)) {
    context.report({ messageId: "unnecessary", node });
  }
};

export const reportImplicit = (
  node: TSESTree.CallExpression,
  context: ChainStyleContext
) => {
  if (isExplicitChainStart(node)) {
    context.report({ messageId: "noExplicit", node });
  }
};

export const reportExplicit = (
  node: TSESTree.CallExpression,
  context: ChainStyleContext,
  program: TSESTree.Program
) => {
  if (isExplicitChainStart(node)) {
    return;
  }

  if (!isLodashCall(node, program)) {
    return;
  }

  const [firstArgument] = node.arguments;

  if (
    !isNil(firstArgument) &&
    isCallExpression(firstArgument) &&
    isLodashCall(firstArgument, program)
  ) {
    context.report({ messageId: "noImplicit", node: firstArgument });
  }
};

export const chainStyleRule = createRule<Options, MessageIds>({
  create(context) {
    const [style = "as-needed"] = context.options;

    const visitCallExpression = (node: TSESTree.CallExpression) => {
      if ("as-needed" === style) {
        reportAsNeeded(node, context);
        return;
      }

      if ("implicit" === style) {
        reportImplicit(node, context);
        return;
      }

      const program = context.sourceCode.ast;
      reportExplicit(node, context, program);
    };

    return {
      CallExpression: visitCallExpression
    };
  },
  defaultOptions: ["as-needed"],
  meta: {
    docs: {
      description: "Enforce a specific chain style for lodash methods"
    },
    messages: {
      noExplicit: "Do not use explicit chaining",
      noImplicit: "Do not use implicit chaining",
      unnecessary: "Unnecessary explicit chaining"
    },
    schema: [
      {
        enum: ["as-needed", "explicit", "implicit"],
        type: "string"
      }
    ],
    type: "suggestion"
  },
  name: "chain-style"
});
