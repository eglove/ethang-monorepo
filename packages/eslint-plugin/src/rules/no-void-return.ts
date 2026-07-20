import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "noVoidReturn";

type Options = [];

// Detect `return void <expr>` pattern
export const detectVoidReturn = (node: TSESTree.Node): boolean => {
  if (AST_NODE_TYPES.ReturnStatement !== node.type) {
    return false;
  }
  const stmt = node as TSESTree.ReturnStatement;
  if (!stmt.argument) {
    return false;
  }
  if (AST_NODE_TYPES.UnaryExpression !== stmt.argument.type) {
    return false;
  }
  const unary = stmt.argument as TSESTree.UnaryExpression;
  return "void" === unary.operator;
};

const buildFix = (
  fixer: TSESLint.RuleFixer,
  node: TSESTree.ReturnStatement
): TSESLint.RuleFix => {
  return fixer.replaceText(node, "return;");
};

export const noVoidReturnRule = createRule<Options, MessageIds>({
  create(context) {
    const listener: TSESLint.RuleListener = {
      ReturnStatement: (node) => {
        if (!detectVoidReturn(node)) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildFix(fixer, node);
          },
          messageId: "noVoidReturn",
          node
        });
      }
    };
    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Prefer bare `return` over `return void 0`."
    },
    fixable: "code",
    messages: {
      noVoidReturn:
        "Prefer `return` over `return void 0`. A bare return statement is equivalent and more idiomatic."
    },
    schema: [],
    type: "problem"
  },
  name: "no-void-return"
});
