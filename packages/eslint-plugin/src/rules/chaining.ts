import {
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import {
  isChainBreaker,
  isExplicitChainStart,
  isMethodCall,
  isObjectOfMethodCall
} from "../utils/chain.ts";
import { isLodashFunction } from "../utils/lodash-api.ts";
import { isChainableMethod } from "../utils/method-data.ts";
import { isCallExpression, isIdentifier } from "../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type ChainingMode = "always" | "implicit" | "never";

type MessageIds = "always" | "never" | "single";

type Options = [ChainingMode?, number?];

const DEFAULT_DEPTH = 3;

const isLodashIdentifierCall = (
  node: TSESTree.CallExpression
): node is { callee: TSESTree.Identifier } & TSESTree.CallExpression => {
  return isIdentifier(node.callee) && isLodashFunction(node.callee.name);
};

const getFirstArgumentCall = (
  node: TSESTree.CallExpression
): null | TSESTree.CallExpression => {
  const [firstArgument] = node.arguments;

  if (!isNil(firstArgument) && isCallExpression(firstArgument)) {
    return firstArgument;
  }

  return null;
};

export const isNestedNLevels = (
  node: TSESTree.CallExpression,
  depth: number,
  isIncludingUnchainable: boolean
): boolean => {
  if (1 === depth) {
    return isLodashIdentifierCall(node);
  }

  if (!isLodashIdentifierCall(node)) {
    return false;
  }

  const methodName = node.callee.name;

  if (!isIncludingUnchainable && !isChainableMethod(methodName)) {
    return false;
  }

  const innerCall = getFirstArgumentCall(node);

  if (!isNil(innerCall)) {
    return isNestedNLevels(innerCall, depth - 1, isIncludingUnchainable);
  }

  return false;
};

export type ChainingContext = TSESLint.RuleContext<MessageIds, Options>;

export const reportOnSingleChain = (
  node: TSESTree.CallExpression,
  context: ChainingContext
): void => {
  const { parent } = node;
  const grandParent = parent.parent;

  const isStandaloneChain =
    !isObjectOfMethodCall(node) ||
    (!isNil(grandParent) &&
      isMethodCall(grandParent) &&
      isChainBreaker(grandParent));

  if (isMethodCall(node) && isStandaloneChain) {
    context.report({ messageId: "single", node });
  }
};

const reportSingleChainFromExplicitStart = (
  node: TSESTree.CallExpression,
  context: ChainingContext
): void => {
  if (!isExplicitChainStart(node)) {
    return;
  }

  const {
    parent: { parent }
  } = node;

  if (!isNil(parent) && isMethodCall(parent)) {
    reportOnSingleChain(parent, context);
  }
};

export const chainingRule = createRule<Options, MessageIds>({
  create(context) {
    const [mode = "never", depth = DEFAULT_DEPTH] = context.options;

    const visitCallExpression = (node: TSESTree.CallExpression): void => {
      if ("never" === mode) {
        if (isExplicitChainStart(node)) {
          context.report({ messageId: "never", node });
        }

        return;
      }

      if ("always" === mode) {
        if (isNestedNLevels(node, depth, true)) {
          context.report({ messageId: "always", node });
          return;
        }

        reportSingleChainFromExplicitStart(node, context);
        return;
      }

      // implicit mode
      if (isNestedNLevels(node, depth, false)) {
        context.report({ messageId: "always", node });
        return;
      }

      reportSingleChainFromExplicitStart(node, context);
    };

    return {
      CallExpression: visitCallExpression
    };
  },
  defaultOptions: ["never", DEFAULT_DEPTH],
  meta: {
    docs: {
      description:
        "Check if a lodash expression could be better expressed as a chain"
    },
    messages: {
      always: "Prefer chaining to composition",
      never: "Prefer composition to Lodash chaining",
      single: "Do not use chain syntax for single method"
    },
    schema: [
      {
        enum: ["always", "never", "implicit"],
        type: "string"
      },
      {
        minimum: 2,
        type: "integer"
      }
    ],
    type: "suggestion"
  },
  name: "chaining"
});
