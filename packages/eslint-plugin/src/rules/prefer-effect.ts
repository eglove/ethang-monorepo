import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import join from "lodash/join.js";
import map from "lodash/map.js";

import { ensureEffectImport, resolveCall } from "../utils/ast.ts";
import { effectApi, isEffectApiMethod } from "../utils/effect-api.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferEffect" | "preferEffectMethod";
type Options = [];

const buildArguments = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  callArguments: readonly TSESTree.CallExpressionArgument[]
): string => {
  const texts = map(callArguments, (argument) => {
    return context.sourceCode.getText(argument);
  });
  return isEmpty(texts) ? "" : `, ${join(texts, ", ")}`;
};

export const preferEffectRule = createRule<Options, MessageIds>({
  create(context) {
    const listener: TSESLint.RuleListener = {
      CallExpression(node) {
        const program = context.sourceCode.ast;
        const resolved = resolveCall(node, program);

        if ("array" !== resolved.kind) {
          return;
        }

        if (!isEffectApiMethod(resolved.methodName)) {
          return;
        }

        /* v8 ignore next -- defensive guard: resolveCall only returns "array" for MemberExpression callees */
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const memberCallee = node.callee;
        const entry = effectApi[resolved.methodName];

        context.report({
          data: {
            method: resolved.methodName,
            target: `${entry.import}.${entry.name}`
          },
          fix(fixer) {
            const importFix = ensureEffectImport(program, fixer);
            const sourceText = context.sourceCode.getText(memberCallee.object);
            const argumentsSuffix = buildArguments(context, node.arguments);
            const replacement = `${entry.import}.${entry.name}(${sourceText}${argumentsSuffix})`;

            if (isNil(importFix)) {
              return fixer.replaceText(node, replacement);
            }

            return [fixer.replaceText(node, replacement), importFix];
          },
          messageId: "preferEffect",
          node
        });
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `effect` (Array module) over native Array.prototype methods when an equivalent exists."
    },
    fixable: "code",
    messages: {
      preferEffect:
        "Prefer `{{target}}` from the `effect` package over `Array.prototype.{{method}}`.",
      preferEffectMethod:
        "Prefer the effect method over the equivalent Array.prototype method."
    },
    schema: [],
    type: "suggestion"
  },
  name: "prefer-effect"
});
