import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashClamp";

type Options = [];

// `Math.<method>` where the receiver is the literal `Math` global and the
// property is a non-computed identifier. Computed access (`Math["min"]`) and
// shadowed `Math` references are deliberately excluded so the rewrite only
// fires on the canonical global.
export const isMathMemberCall = (
  node: TSESTree.Node,
  method: string
): node is TSESTree.MemberExpression => {
  if (AST_NODE_TYPES.MemberExpression !== node.type) {
    return false;
  }
  if (node.computed) {
    return false;
  }
  const { object } = node;
  if (AST_NODE_TYPES.Identifier !== object.type) {
    return false;
  }
  if ("Math" !== object.name) {
    return false;
  }
  const { property } = node;
  if (AST_NODE_TYPES.Identifier !== property.type) {
    return false;
  }
  return method === property.name;
};

export const isMathMinCall = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return false;
  }
  return isMathMemberCall(node.callee, "min");
};

export const isMathMaxCall = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return false;
  }
  return isMathMemberCall(node.callee, "max");
};

export const isNestedMathCall = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return false;
  }
  return (
    isMathMemberCall(node.callee, "min") || isMathMemberCall(node.callee, "max")
  );
};

const isExpression = (node: TSESTree.Node): node is TSESTree.Expression => {
  return AST_NODE_TYPES.SpreadElement !== node.type;
};

export type ClampMatch = {
  readonly lower: TSESTree.Expression;
  readonly upper: TSESTree.Expression;
  readonly value: TSESTree.Expression;
};

// Read the inner `Math.max(lower, x)` / `Math.min(upper, x)` and pull out
// the bound + the value being clamped. Refuses to rewrite when either
// argument is itself a clamp call (we'd silently drop a bound).
export const readInnerCall = (
  innerCall: TSESTree.CallExpression,
  kind: "max" | "min"
) => {
  if (!isMathMemberCall(innerCall.callee, kind)) {
    return null;
  }
  const [bound, value] = innerCall.arguments;
  if (!bound || !value) {
    return null;
  }
  if (!isExpression(bound) || !isExpression(value)) {
    return null;
  }
  if (isNestedMathCall(bound) || isNestedMathCall(value)) {
    return null;
  }
  return { bound, value };
};

type ClampShape = {
  readonly innerIndex: 0 | 1;
  readonly innerKind: "max" | "min";
  readonly outerKind: "max" | "min";
};

const clampShapes: readonly ClampShape[] = [
  // Math.min(upper, Math.max(lower, x))
  { innerIndex: 1, innerKind: "max", outerKind: "min" },
  // Math.min(Math.max(lower, x), upper)
  { innerIndex: 0, innerKind: "max", outerKind: "min" },
  // Math.max(lower, Math.min(upper, x))
  { innerIndex: 1, innerKind: "min", outerKind: "max" },
  // Math.max(Math.min(upper, x), lower)
  { innerIndex: 0, innerKind: "min", outerKind: "max" }
];

const outerSideIndex = (shape: ClampShape) => {
  // 1 - 0 = 1, 1 - 1 = 0; ClampShape.innerIndex is `0 | 1` so the result
  // is also `0 | 1`.
  return 1 - shape.innerIndex;
};

export const tryShape = (
  callee: TSESTree.Expression,
  argumentList: readonly TSESTree.CallExpressionArgument[],
  shape: ClampShape
) => {
  if (!isMathMemberCall(callee, shape.outerKind)) {
    return null;
  }
  const outerIndex = outerSideIndex(shape);
  const outerBound = argumentList[outerIndex];
  const innerArgument = argumentList[shape.innerIndex];
  if (!outerBound || !innerArgument) {
    return null;
  }
  if (!isExpression(outerBound)) {
    return null;
  }
  if (AST_NODE_TYPES.CallExpression !== innerArgument.type) {
    return null;
  }
  const inner = readInnerCall(innerArgument, shape.innerKind);
  if (!inner) {
    return null;
  }
  const lower = "min" === shape.outerKind ? inner.bound : outerBound;
  const upper = "min" === shape.outerKind ? outerBound : inner.bound;
  return { lower, upper, value: inner.value };
};

// Recognize all four `Math.min`/`Math.max` clamp rearrangements. The value
// being clamped is always the inner call's second argument; the outer-side
// argument becomes the other bound. The mapping between inner-bound and
// `lower`/`upper` flips depending on which `Math` method was on the outside.
export const getClampArgumentExpressions = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return null;
  }
  const { arguments: argumentList, callee } = node;
  if (2 !== argumentList.length) {
    return null;
  }

  for (const shape of clampShapes) {
    const matched = tryShape(callee, argumentList, shape);
    if (matched) {
      return matched;
    }
  }
  return null;
};

export const detectClampPattern = (node: TSESTree.Node) => {
  return getClampArgumentExpressions(node);
};

const isTwoArgumentMathMinMaxCall = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return false;
  }
  if (2 !== node.arguments.length) {
    return false;
  }
  return (
    isMathMemberCall(node.callee, "min") || isMathMemberCall(node.callee, "max")
  );
};

// True when `node` is an argument to an enclosing `Math.min`/`Math.max`
// call. We refuse to fire the rule in that case — even if the enclosing
// call doesn't itself match a clamp shape (e.g. the inner of
// `Math.min(10, Math.max(0, Math.min(5, x)))`), rewriting the inner alone
// would silently drop the enclosing bound. The outer expression must be
// handled as a whole (or not at all) by the rule.
export const isInsideMathMinMaxCall = (node: TSESTree.Node) => {
  const advance = (current: TSESTree.Node) => {
    if (!current.parent) {
      return null;
    }
    return current.parent;
  };
  let current: null | TSESTree.Node = advance(node);
  while (current) {
    if (isTwoArgumentMathMinMaxCall(current)) {
      return true;
    }
    current = advance(current);
  }
  return false;
};

export const formatClampCall = (
  value: string,
  lower: string,
  upper: string
) => {
  return `clamp(${value}, ${lower}, ${upper})`;
};

const UMBRELLA_DISABLE_COMMENT = `// eslint-disable-next-line @ethang/prefer-lodash`;

export const buildClampFix = (
  fixer: TSESLint.RuleFixer,
  call: TSESTree.CallExpression,
  match: ClampMatch,
  sourceText: string
) => {
  const getText = (node: TSESTree.Expression) => {
    return sourceText.slice(node.range[0], node.range[1]);
  };
  const lowerText = getText(match.lower);
  const upperText = getText(match.upper);
  const valueText = getText(match.value);
  const replacement = formatClampCall(valueText, lowerText, upperText);
  const replace = fixer.replaceText(call, replacement);
  const disable = fixer.insertTextBefore(call, `${UMBRELLA_DISABLE_COMMENT}\n`);
  return [replace, disable] as readonly [TSESLint.RuleFix, TSESLint.RuleFix];
};

export const preferLodashClampRule = createRule<Options, MessageIds>({
  create(context) {
    const sourceText = context.sourceCode.text;
    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        if (isInsideMathMinMaxCall(node)) {
          return;
        }
        const match = detectClampPattern(node);
        if (!match) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildClampFix(fixer, node, match, sourceText);
          },
          messageId: "preferLodashClamp",
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
        "Prefer `_.clamp(value, lower, upper)` over the native `Math.min`/`Math.max` clamp idiom."
    },
    fixable: "code",
    messages: {
      preferLodashClamp:
        "Prefer `clamp(value, lower, upper)` over `Math.min(upper, Math.max(lower, value))`. Lodash ships `clamp` directly and avoids the double-`Math` ceremony."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-clamp"
});
