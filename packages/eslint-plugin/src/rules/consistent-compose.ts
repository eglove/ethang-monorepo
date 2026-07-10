import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

import { isLodashCall, resolveCall } from "../utils/ast.ts";
import {
  ALL_COMPOSE_METHODS,
  COMPOSE_LEFT_TO_RIGHT,
  getMainAlias
} from "../utils/method-data.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type Direction = "compose" | "flow" | "flowRight" | "pipe";

type MessageIds = "preferComposeDirection";

type Options = [Direction];

const getDirectionGroup = (method: string): "ltr" | "rtl" => {
  return COMPOSE_LEFT_TO_RIGHT.has(method) ? "ltr" : "rtl";
};

export const consistentComposeRule = createRule<Options, MessageIds>({
  create(context) {
    // eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- context.options is [] at runtime when no options configured
    const [direction = "flow"] = context.options;
    const preferredGroup = COMPOSE_LEFT_TO_RIGHT.has(direction) ? "ltr" : "rtl";
    const program = context.sourceCode.ast;

    const reportIfWrongDirection = (node: TSESTree.CallExpression): void => {
      if (!isLodashCall(node, program)) {
        return;
      }

      const { methodName } = resolveCall(node, program);

      if (!ALL_COMPOSE_METHODS.has(methodName)) {
        return;
      }

      const methodGroup = getDirectionGroup(methodName);

      if (methodGroup === preferredGroup) {
        return;
      }

      const preferredMethod = getMainAlias(direction);

      context.report({
        data: { method: methodName, preferred: preferredMethod },
        messageId: "preferComposeDirection",
        node
      });
    };

    return {
      CallExpression: reportIfWrongDirection
    };
  },
  defaultOptions: ["flow"],
  meta: {
    docs: {
      description:
        "Enforce a consistent composition direction (flow/pipe vs flowRight/compose)."
    },
    messages: {
      preferComposeDirection:
        "Use '{{preferred}}' for composition instead of '{{method}}'."
    },
    schema: [
      {
        enum: ["flow", "flowRight", "pipe", "compose"],
        type: "string"
      }
    ],
    type: "problem"
  },
  name: "consistent-compose"
});
