import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

import {
  getEndOfChain,
  isCallToMethod,
  isChainBreaker,
  isExplicitChainStart
} from "../utils/chain.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "missing";

type Options = [];

export const unwrapRule = createRule<Options, MessageIds>({
  create(context) {
    const visitCallExpression = (node: TSESTree.CallExpression) => {
      if (!isExplicitChainStart(node)) {
        return;
      }

      const end = getEndOfChain(node, true);

      if (isCallToMethod(end, "commit")) {
        return;
      }

      if (!isChainBreaker(end)) {
        context.report({ messageId: "missing", node: end });
      }
    };

    return {
      CallExpression: visitCallExpression
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Require lodash chains to end with a chain-breaking method"
    },
    messages: {
      missing: "Missing unwrapping at end of chain"
    },
    schema: [],
    type: "problem"
  },
  name: "unwrap"
});
