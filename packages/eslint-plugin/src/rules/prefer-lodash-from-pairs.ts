import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

import { isIdentifier } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashFromPairs";

type Options = [];

// The callee must be a non-computed member access on the literal `Object`
// global — `Object.fromEntries(...)`, not a shadowed or computed variant.
const isObjectGlobalCallee = (
  callee: TSESTree.Node
): callee is TSESTree.MemberExpression => {
  return (
    AST_NODE_TYPES.MemberExpression === callee.type &&
    !callee.computed &&
    isIdentifier(callee.object) &&
    "Object" === callee.object.name
  );
};

// Detect `Object.fromEntries(pairs)` pattern
export const isObjectFromEntriesCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return false;
  }
  const { arguments: callArguments, callee } = node;
  if (1 !== callArguments.length || !isObjectGlobalCallee(callee)) {
    return false;
  }

  if (
    !isIdentifier(callee.property) ||
    "fromEntries" !== callee.property.name
  ) {
    // This branch is unreachable: when computed=false, property MUST be an Identifier
    return false;
  }
  return true;
};

const buildFix = (
  fixer: TSESLint.RuleFixer,
  node: TSESTree.CallExpression,
  sourceCode: TSESLint.SourceCode
) => {
  const [argument] = node.arguments;

  const argumentText = argument ? sourceCode.getText(argument) : "";
  // This is unreachable: isObjectFromEntriesCall ensures exactly 1 argument exists
  return fixer.replaceText(node, `fromPairs(${argumentText})`);
};

export const preferLodashFromPairsRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;
    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        if (!isObjectFromEntriesCall(node)) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(fixer, node, sourceCode);
          },
          messageId: "preferLodashFromPairs",
          node
        });
      }
    };
    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Prefer `_.fromPairs` over `Object.fromEntries`."
    },
    fixable: "code",
    messages: {
      preferLodashFromPairs:
        "Prefer `fromPairs(pairs)` over `Object.fromEntries(pairs)`. Lodash provides fromPairs for consistency with other array utilities."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-from-pairs"
});
