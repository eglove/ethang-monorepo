import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferEffectEqual";

type Options = [];

// Check if a node is a CallExpression calling JSON.stringify
export const isJsonStringifyCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return false;
  }

  const callee = node.callee;
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    return false;
  }

  if (AST_NODE_TYPES.Identifier !== callee.object.type) {
    return false;
  }

  if ("JSON" !== callee.object.name) {
    return false;
  }

  if (AST_NODE_TYPES.Identifier !== callee.property.type) {
    return false;
  }

  return "stringify" === callee.property.name;
};

export const detectEqualPattern = (
  node: TSESTree.Node,
  _sourceText: string
) => {
  if (AST_NODE_TYPES.BinaryExpression !== node.type) {
    return null;
  }

  const binary = node;

  // Must be strict equality or inequality
  if ("===" !== binary.operator && "!==" !== binary.operator) {
    return null;
  }

  // Both sides must be JSON.stringify calls
  if (!isJsonStringifyCall(binary.left) || !isJsonStringifyCall(binary.right)) {
    return null;
  }

  return {
    left: binary.left,
    right: binary.right
  };
};

export const preferEffectEqualRule = createRule<Options, MessageIds>({
  create(context) {
    const sourceText = context.sourceCode.text;
    return {
      BinaryExpression: (node) => {
        const match = detectEqualPattern(node, sourceText);
        if (!match) {
          return;
        }
        context.report({
          messageId: "preferEffectEqual",
          node
        });
      }
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `Equal.equals(a, b)` over `JSON.stringify(a) === JSON.stringify(b)` for deep equality checks."
    },
    messages: {
      preferEffectEqual:
        "Prefer `Equal.equals(a, b)` over `JSON.stringify(a) === JSON.stringify(b)`. Effect provides a correct deep equality check."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-equal"
});
