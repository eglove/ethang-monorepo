import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import { isLodashCall, resolveCall } from "../utils/ast.ts";
import { getMainAlias, LODASH_V4_ALIAS_TO_MAIN } from "../utils/method-data.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferAlias";

type Options = [
  {
    readonly ignoreMethods?: readonly string[];
  }
];

const isAliasMethod = (method: string) => {
  return LODASH_V4_ALIAS_TO_MAIN.has(method);
};

const isIgnored = (method: string, ignoreMethods: ReadonlySet<string>) => {
  return ignoreMethods.has(method);
};

export const preferredAliasRule = createRule<Options, MessageIds>({
  create(context) {
    // eslint-disable-next-line @typescript-eslint/no-useless-default-assignment -- context.options is [] at runtime when no options configured
    const [options = {}] = context.options;
    // eslint-disable-next-line unicorn/no-useless-collection-argument -- ignoreMethods is undefined at runtime when not configured
    const ignoreMethods = new Set(options.ignoreMethods ?? []);
    const program = context.sourceCode.ast;

    const reportIfAlias = (node: TSESTree.CallExpression) => {
      if (!isLodashCall(node, program)) {
        return;
      }

      const { methodName, receiver } = resolveCall(node, program);

      // Skip top-level identifier calls (e.g. `head(xs)` from a lodash deep
      // import) where the receiver is null — we can't statically verify the
      // argument is array-like and may produce false positives on non-array
      // receivers like Playwright Locators.
      if (isNil(receiver)) {
        return;
      }

      if (!isAliasMethod(methodName) || isIgnored(methodName, ignoreMethods)) {
        return;
      }

      context.report({
        data: { alias: methodName, method: getMainAlias(methodName) },
        messageId: "preferAlias",
        node
      });
    };

    return {
      CallExpression: reportIfAlias
    };
  },
  defaultOptions: [{}],
  meta: {
    docs: {
      description:
        "Prefer canonical lodash method names over aliases (e.g. forEach over each)."
    },
    messages: {
      preferAlias:
        "Method '{{alias}}' is an alias; for consistency prefer using '{{method}}'."
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          ignoreMethods: {
            items: { type: "string" },
            type: "array"
          }
        },
        type: "object"
      }
    ],
    type: "suggestion"
  },
  name: "preferred-alias"
});
