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

// True when `callee` is a member access on the global `JSON` identifier.
const isJsonMemberAccess = (
  callee: TSESTree.Expression
): callee is TSESTree.MemberExpression => {
  return (
    AST_NODE_TYPES.MemberExpression === callee.type &&
    AST_NODE_TYPES.Identifier === callee.object.type &&
    "JSON" === callee.object.name
  );
};

// Check if a node is a CallExpression calling JSON.stringify
export const isJsonStringifyCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return false;
  }

  const callee = node.callee;
  return (
    isJsonMemberAccess(callee) &&
    AST_NODE_TYPES.Identifier === callee.property.type &&
    "stringify" === callee.property.name
  );
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
