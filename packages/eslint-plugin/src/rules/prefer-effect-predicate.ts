import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isString from "lodash/isString.js";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

// Wave 1 scope: lodash ships `_.isNull`, `_.isUndefined`, and `_.isNil`,
// so `isNull` / `isUndefined` / `isNotNullable` are out of scope here.
// Object checks fall to `_.isObject` via the umbrella `prefer-lodash`
// rule. Only the two native-`typeof` predicates lodash doesn't expose
// remain: `bigint` and `symbol`.
type MessageIds =
  "preferEffectPredicateIsBigInt" | "preferEffectPredicateIsSymbol";

type Options = [];

// `typeof X === "<name>"` → `Predicate.is<Name>(x)` for the subset of
// `typeof` results Effect ships a predicate for *and* lodash has no
// equivalent of. `bigint` and `symbol` are the only native-`typeof`
// results in that set. Keyed by the `typeof` literal, value is the
// rule's messageId so we never concatenate strings at runtime.
const TYPEOF_MESSAGE_IDS = {
  bigint: "preferEffectPredicateIsBigInt",
  symbol: "preferEffectPredicateIsSymbol"
} as const satisfies Record<string, MessageIds>;

type TypeofPredicateLiteral = keyof typeof TYPEOF_MESSAGE_IDS;

const isTypeofPredicateLiteral = (
  name: string
): name is TypeofPredicateLiteral => {
  return Object.hasOwn(TYPEOF_MESSAGE_IDS, name);
};

export const isTypeofExpression = (expression: TSESTree.Node) => {
  return (
    AST_NODE_TYPES.UnaryExpression === expression.type &&
    "typeof" === expression.operator
  );
};

export const getStringLiteral = (expression: TSESTree.Node) => {
  if (AST_NODE_TYPES.Literal !== expression.type) {
    return null;
  }
  if (!isString(expression.value)) {
    return null;
  }
  return expression.value;
};

export const getTypeofLiteral = (node: TSESTree.BinaryExpression) => {
  if ("===" !== node.operator && "!==" !== node.operator) {
    return null;
  }

  if (isTypeofExpression(node.left)) {
    return getStringLiteral(node.right);
  }

  if (isTypeofExpression(node.right)) {
    return getStringLiteral(node.left);
  }

  return null;
};

export const resolveTypeofPredicate = (node: TSESTree.BinaryExpression) => {
  const literal = getTypeofLiteral(node);
  if (!isString(literal) || !isTypeofPredicateLiteral(literal)) {
    return null;
  }
  return { messageId: TYPEOF_MESSAGE_IDS[literal], node };
};

export const detectPredicateRecommendation = (
  node: TSESTree.BinaryExpression
) => {
  return resolveTypeofPredicate(node);
};

export const preferEffectPredicateRule = createRule<Options, MessageIds>({
  create(context) {
    const listener: TSESLint.RuleListener = {
      BinaryExpression: (node) => {
        const result = detectPredicateRecommendation(node);
        if (!result) {
          return;
        }
        context.report({
          messageId: result.messageId,
          node: result.node
        });
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `Effect.Predicate.isBigInt` / `Effect.Predicate.isSymbol` over native `typeof` checks. Lodash has no equivalent for these two predicates."
    },
    messages: {
      preferEffectPredicateIsBigInt:
        'Use `Predicate.isBigInt(value)` instead of `typeof value === "bigint"`. Lodash has no equivalent — Effect\'s predicate is the canonical check.',
      preferEffectPredicateIsSymbol:
        'Use `Predicate.isSymbol(value)` instead of `typeof value === "symbol"`. Lodash has no equivalent — Effect\'s predicate is the canonical check.'
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-predicate"
});
