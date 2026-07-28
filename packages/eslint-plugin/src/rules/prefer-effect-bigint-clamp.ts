import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferEffectBigIntClamp";

type Options = [];

// Compare two expressions by their source text
const areExpressionsMatch = (
  a: TSESTree.Expression,
  b: TSESTree.Expression,
  sourceText: string
) => {
  return (
    sourceText.slice(a.range[0], a.range[1]) ===
    sourceText.slice(b.range[0], b.range[1])
  );
};

// Check if a binary expression uses the given comparison operator
const isComparison = (
  node: TSESTree.Node,
  operator: "<" | ">"
): node is TSESTree.BinaryExpression => {
  if (AST_NODE_TYPES.BinaryExpression !== node.type) {
    return false;
  }
  return operator === node.operator;
};

type ClampMatch = {
  readonly max: TSESTree.Expression;
  readonly min: TSESTree.Expression;
  readonly value: TSESTree.Expression;
};

// Pattern 1: x > max ? max : (x < min ? min : x)
export const tryMatchPattern1 = (
  ternary: TSESTree.ConditionalExpression,
  sourceText: string
) => {
  const { alternate, consequent, test } = ternary;

  // Outer: x > max
  if (!isComparison(test, ">")) {
    return null;
  }

  const value = test.left;

  if (AST_NODE_TYPES.PrivateIdentifier === value.type) {
    return null;
  }
  const maxCandidate = test.right;

  // consequent must be max
  if (!areExpressionsMatch(consequent, maxCandidate, sourceText)) {
    return null;
  }

  // alternate must be: x < min ? min : x
  if (AST_NODE_TYPES.ConditionalExpression !== alternate.type) {
    return null;
  }
  const inner = alternate;

  if (!isComparison(inner.test, "<")) {
    return null;
  }

  const minCandidate = inner.test.right;

  // inner consequent must be min
  if (!areExpressionsMatch(inner.consequent, minCandidate, sourceText)) {
    return null;
  }

  // inner alternate must be value
  if (!areExpressionsMatch(inner.alternate, value, sourceText)) {
    return null;
  }

  return {
    max: maxCandidate,
    min: minCandidate,
    value
  };
};

// Pattern 2: x < min ? min : (x > max ? max : x)
export const tryMatchPattern2 = (
  ternary: TSESTree.ConditionalExpression,
  sourceText: string
) => {
  const { alternate, consequent, test } = ternary;

  // Outer: x < min
  if (!isComparison(test, "<")) {
    return null;
  }

  const value = test.left;

  if (AST_NODE_TYPES.PrivateIdentifier === value.type) {
    return null;
  }
  const minCandidate = test.right;

  // consequent must be min
  if (!areExpressionsMatch(consequent, minCandidate, sourceText)) {
    return null;
  }

  // alternate must be: x > max ? max : x
  if (AST_NODE_TYPES.ConditionalExpression !== alternate.type) {
    return null;
  }
  const inner = alternate;

  if (!isComparison(inner.test, ">")) {
    return null;
  }

  const maxCandidate = inner.test.right;

  // inner consequent must be max
  if (!areExpressionsMatch(inner.consequent, maxCandidate, sourceText)) {
    return null;
  }

  // inner alternate must be value
  if (!areExpressionsMatch(inner.alternate, value, sourceText)) {
    return null;
  }

  return {
    max: maxCandidate,
    min: minCandidate,
    value
  };
};

export const detectBigIntClampPattern = (
  node: TSESTree.Node,
  sourceText: string
) => {
  if (AST_NODE_TYPES.ConditionalExpression !== node.type) {
    return null;
  }

  const ternary = node;

  // Try both patterns
  const match1 = tryMatchPattern1(ternary, sourceText);
  if (match1) {
    return match1;
  }

  const match2 = tryMatchPattern2(ternary, sourceText);
  if (match2) {
    return match2;
  }

  return null;
};

export const buildBigIntClampFix = (
  fixer: TSESLint.RuleFixer,
  ternary: TSESTree.ConditionalExpression,
  match: ClampMatch,
  sourceText: string
) => {
  const valueText = sourceText.slice(
    match.value.range[0],
    match.value.range[1]
  );
  const minText = sourceText.slice(match.min.range[0], match.min.range[1]);
  const maxText = sourceText.slice(match.max.range[0], match.max.range[1]);
  const replacement = `BigInt.clamp(${valueText}, { min: ${minText}, max: ${maxText} })`;
  return fixer.replaceText(ternary, replacement);
};

export const preferEffectBigIntClampRule = createRule<Options, MessageIds>({
  create(context) {
    const sourceText = context.sourceCode.text;
    return {
      ConditionalExpression: (node) => {
        const match = detectBigIntClampPattern(node, sourceText);
        if (!match) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildBigIntClampFix(fixer, node, match, sourceText);
          },
          messageId: "preferEffectBigIntClamp",
          node
        });
      }
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `BigInt.clamp(x, {min, max})` over ternary clamp patterns on bigints."
    },
    fixable: "code",
    messages: {
      preferEffectBigIntClamp:
        "Prefer `BigInt.clamp(x, {min, max})` over `x > max ? max : x < min ? min : x`. Effect provides a cleaner alternative."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-bigint-clamp"
});
