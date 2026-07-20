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
// Wave 2 (consolidated #25-29): `instanceof` predicates for Date, Error,
// Function, Map, Set — Effect Predicate provides safer alternatives.
type MessageIds =
  | "preferEffectPredicateIsBigInt"
  | "preferEffectPredicateIsSymbol"
  | "preferEffectPredicateIsDate"
  | "preferEffectPredicateIsError"
  | "preferEffectPredicateIsFunction"
  | "preferEffectPredicateIsMap"
  | "preferEffectPredicateIsSet";

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
  const typeofResult = resolveTypeofPredicate(node);
  if (typeofResult) {
    return typeofResult;
  }
  return detectInstanceofPredicate(node);
};

// `x instanceof <Name>` → `Predicate.is<Name>(x)` for the set of
// `instanceof` targets Effect ships a predicate for. Date, Error,
// Function, Map, Set are the targets in that set.
const INSTANCEOF_MESSAGE_IDS = {
  Date: "preferEffectPredicateIsDate",
  Error: "preferEffectPredicateIsError",
  Function: "preferEffectPredicateIsFunction",
  Map: "preferEffectPredicateIsMap",
  Set: "preferEffectPredicateIsSet"
} as const satisfies Record<string, MessageIds>;

export const detectInstanceofPredicate = (
  node: TSESTree.Node
): { messageId: MessageIds; node: TSESTree.BinaryExpression } | null => {
  if (AST_NODE_TYPES.BinaryExpression !== node.type) {
    return null;
  }
  const binary = node as TSESTree.BinaryExpression;
  if ("instanceof" !== binary.operator) {
    return null;
  }
  const right = binary.right;
  if (AST_NODE_TYPES.Identifier !== right.type) {
    return null;
  }
  const name = right.name;
  if (!Object.hasOwn(INSTANCEOF_MESSAGE_IDS, name)) {
    return null;
  }
  return { messageId: INSTANCEOF_MESSAGE_IDS[name], node: binary };
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
        "Prefer Effect Predicate checks over native `typeof` and `instanceof` checks. Lodash has no equivalent for these predicates."
    },
    messages: {
      preferEffectPredicateIsBigInt:
        'Use `Predicate.isBigInt(value)` instead of `typeof value === "bigint"`. Lodash has no equivalent — Effect\'s predicate is the canonical check.',
      preferEffectPredicateIsSymbol:
        'Use `Predicate.isSymbol(value)` instead of `typeof value === "symbol"`. Lodash has no equivalent — Effect\'s predicate is the canonical check.',
      preferEffectPredicateIsDate:
        'Use `Predicate.isDate(value)` instead of `value instanceof Date`. Effect\'s predicate is the canonical check.',
      preferEffectPredicateIsError:
        'Use `Predicate.isError(value)` instead of `value instanceof Error`. Effect\'s predicate is the canonical check.',
      preferEffectPredicateIsFunction:
        'Use `Predicate.isFunction(value)` instead of `value instanceof Function`. Effect\'s predicate is the canonical check.',
      preferEffectPredicateIsMap:
        'Use `Predicate.isMap(value)` instead of `value instanceof Map`. Effect\'s predicate is the canonical check.',
      preferEffectPredicateIsSet:
        'Use `Predicate.isSet(value)` instead of `value instanceof Set`. Effect\'s predicate is the canonical check.'
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-predicate"
});
