import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "noDoubleUnary";

type Options = [];

// Detect `!!expr` — a `!` whose argument is itself a `!`
export const detectDoubleUnary = (node: TSESTree.Node): boolean => {
  if (AST_NODE_TYPES.UnaryExpression !== node.type) {
    return false;
  }
  const unary = node as TSESTree.UnaryExpression;
  if ("!" !== unary.operator) {
    return false;
  }
  if (AST_NODE_TYPES.UnaryExpression !== unary.argument.type) {
    return false;
  }
  const inner = unary.argument as TSESTree.UnaryExpression;
  return "!" === inner.operator;
};

const buildFix = (
  fixer: TSESLint.RuleFixer,
  node: TSESTree.UnaryExpression,
  sourceCode: TSESLint.SourceCode
): TSESLint.RuleFix => {
  // !!expr → Boolean(expr)
  const inner = node.argument as TSESTree.UnaryExpression;
  const innerArg = inner.argument;
  const argText = sourceCode.getText(innerArg);
  return fixer.replaceText(node, `Boolean(${argText})`);
};

export const noDoubleUnaryRule = createRule<Options, MessageIds>({
  create(context) {
    const sourceCode = context.sourceCode;
    const listener: TSESLint.RuleListener = {
      UnaryExpression: (node) => {
        if (!detectDoubleUnary(node)) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(fixer, node, sourceCode);
          },
          messageId: "noDoubleUnary",
          node
        });
      }
    };
    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Prefer `Boolean(x)` over `!!x`."
    },
    fixable: "code",
    messages: {
      noDoubleUnary:
        "Prefer `Boolean(x)` over `!!x`. `Boolean()` is more explicit and avoids the double-negation ceremony."
    },
    schema: [],
    type: "problem"
  },
  name: "no-double-unary"
});
