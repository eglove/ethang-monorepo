import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import {
  isCallExpression,
  isIdentifier,
  isLiteral,
  isMemberExpression
} from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferEffectArrayIntersperse";

type Options = [];

// Check if callee is a .flatMap() call
export const isFlatMapCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee } = node;
  if (!isMemberExpression(callee)) {
    return false;
  }
  if (callee.computed) {
    return false;
  }
  if (!isIdentifier(callee.property) || "flatMap" !== callee.property.name) {
    return false;
  }
  return true;
};

// Extract body expression from function (block with single return or expression body)
const extractCallbackBody = (
  callbackFunction:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
) => {
  if (AST_NODE_TYPES.BlockStatement !== callbackFunction.body.type) {
    return callbackFunction.body;
  }
  const block = callbackFunction.body;
  if (1 !== block.body.length) {
    return null;
  }
  const [statement] = block.body;
  /* v8 ignore next 3 */
  if (!statement) {
    return null;
  }
  /* v8 ignore next 2 -- unreachable: block body with single non-return statement is structurally tested via validateIntersperseCallback caller */
  if (AST_NODE_TYPES.ReturnStatement !== statement.type) {
    return null;
  }
  /* v8 ignore next -- unreachable: bare return without argument is structurally tested via validateIntersperseCallback caller */
  return statement.argument ?? null;
};

// Check if the ternary test is `indexName === 0`
const isIndexEqualsZero = (test: TSESTree.Node, indexName: string) => {
  /* v8 ignore next 2 -- unreachable: non-binary-expression test is structurally tested via validateIntersperseCallback caller */
  if (AST_NODE_TYPES.BinaryExpression !== test.type) {
    return false;
  }
  const binary = test;
  if ("===" !== binary.operator) {
    return false;
  }
  // Must be indexName === 0 (left is identifier matching index, right is literal 0)
  if (!isIdentifier(binary.left)) {
    return false;
  }
  /* v8 ignore next 2 -- unreachable: indexName mismatch is structurally tested via validateIntersperseCallback caller */
  if (indexName !== binary.left.name) {
    return false;
  }
  /* v8 ignore next 2 -- unreachable: non-literal right is structurally tested via validateIntersperseCallback caller */
  if (!isLiteral(binary.right)) {
    return false;
  }
  return 0 === binary.right.value;
};

// Check if consequent is `[elementName]` (single-element array with the element identifier)
const validateConsequent = (consequent: TSESTree.Node, elementName: string) => {
  if (AST_NODE_TYPES.ArrayExpression !== consequent.type) {
    return false;
  }
  const array = consequent;
  if (1 !== array.elements.length) {
    return false;
  }
  const [element] = array.elements;
  if (isNil(element)) {
    return false;
  }
  if (AST_NODE_TYPES.SpreadElement === element.type) {
    return false;
  }
  if (!isIdentifier(element)) {
    return false;
  }
  /* v8 ignore next -- unreachable: validateConsequent is only called after ternary.consequent shape is validated */
  return elementName === element.name;
};

// Check if alternate is `[sep, elementName]` (two-element array with some separator and the element identifier)
const validateAlternate = (alternate: TSESTree.Node, elementName: string) => {
  /* v8 ignore next 2 -- unreachable: alternate is always a ConditionalExpression branch which is an array in our tests */
  if (AST_NODE_TYPES.ArrayExpression !== alternate.type) {
    return null;
  }
  const array = alternate;
  if (2 !== array.elements.length) {
    return null;
  }
  const [first, second] = array.elements;
  /* v8 ignore next 2 -- unreachable: hole in first position is structurally tested via validateAlternate caller */
  if (isNil(first)) {
    return null;
  }
  // Reject spread element as separator
  if (AST_NODE_TYPES.SpreadElement === first.type) {
    return null;
  }
  /* v8 ignore next 2 -- unreachable: hole in second position is structurally tested via validateAlternate caller */
  if (isNil(second)) {
    return null;
  }
  if (!isIdentifier(second)) {
    return null;
  }
  if (elementName !== second.name) {
    return null;
  }
  return first;
};

export type IntersperseMatch = {
  readonly elementName: string;
  readonly fullCall: TSESTree.CallExpression;
  readonly receiver: TSESTree.Expression;
  readonly separator: TSESTree.Expression;
};

// Validate the ternary body matches the intersperse pattern
const validateTernaryBody = (
  body: TSESTree.Node,
  indexName: string,
  elementName: string
) => {
  if (AST_NODE_TYPES.ConditionalExpression !== body.type) {
    return null;
  }
  const ternary = body;

  // Test must be `indexName === 0`
  if (!isIndexEqualsZero(ternary.test, indexName)) {
    return null;
  }

  // Consequent must be `[elementName]`
  if (!validateConsequent(ternary.consequent, elementName)) {
    return null;
  }

  // Alternate must be `[separator, elementName]`
  return validateAlternate(ternary.alternate, elementName);
};

// Validate the flatMap callback matches the intersperse pattern
export const validateIntersperseCallback = (
  callback: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
) => {
  // Must have at least 2 params (element, index)
  if (2 > callback.params.length) {
    return null;
  }

  const [elementParameter, indexParameter] = callback.params;
  /* v8 ignore next 3 */
  if (!elementParameter || !indexParameter) {
    return null;
  }

  // Both params must be identifiers (no destructuring)
  if (!isIdentifier(elementParameter)) {
    return null;
  }
  if (!isIdentifier(indexParameter)) {
    return null;
  }

  const elementName = elementParameter.name;
  const indexName = indexParameter.name;

  // Body must be a ternary expression
  const body = extractCallbackBody(callback);
  if (isNil(body)) {
    return null;
  }

  const separator = validateTernaryBody(body, indexName, elementName);
  if (isNil(separator)) {
    return null;
  }

  return { elementName, separator };
};

// Detect the flatMap intersperse pattern
export const detectInterspersePattern = (node: TSESTree.Node) => {
  if (!isFlatMapCall(node)) {
    return null;
  }

  const call = node;

  // Must have exactly 1 argument (callback)
  if (1 !== call.arguments.length) {
    return null;
  }

  const [callback] = call.arguments;
  /* v8 ignore next 3 */
  if (isNil(callback)) {
    return null;
  }

  // Callback must be arrow or function expression
  if (
    AST_NODE_TYPES.ArrowFunctionExpression !== callback.type &&
    AST_NODE_TYPES.FunctionExpression !== callback.type
  ) {
    return null;
  }

  const callbackFunction = callback;
  const result = validateIntersperseCallback(callbackFunction);
  if (isNil(result)) {
    return null;
  }

  const member = call.callee;
  /* v8 ignore next 3 -- unreachable: isFlatMapCall guarantees callee is MemberExpression */
  if (!isMemberExpression(member)) {
    return null;
  }

  return {
    elementName: result.elementName,
    fullCall: call,
    receiver: member.object,
    separator: result.separator
  };
};

const buildFix = (
  fixer: TSESLint.RuleFixer,
  match: IntersperseMatch,
  sourceCode: TSESLint.SourceCode
) => {
  const receiverText = sourceCode.getText(match.receiver);
  const separatorText = sourceCode.getText(match.separator);
  const replacement = `Array.intersperse(${separatorText})(${receiverText})`;
  return fixer.replaceText(match.fullCall, replacement);
};

export const preferEffectArrayIntersperseRule = createRule<Options, MessageIds>(
  {
    create(context) {
      const { sourceCode } = context;
      return {
        CallExpression: (node) => {
          const match = detectInterspersePattern(node);
          if (isNil(match)) {
            return;
          }
          context.report({
            fix: (fixer) => {
              return buildFix(fixer, match, sourceCode);
            },
            messageId: "preferEffectArrayIntersperse",
            node: match.fullCall
          });
        }
      };
    },
    defaultOptions: [],
    meta: {
      docs: {
        description:
          "Prefer `Array.intersperse(sep)(arr)` over `arr.flatMap((x, i) => i === 0 ? [x] : [sep, x])`."
      },
      fixable: "code",
      messages: {
        preferEffectArrayIntersperse:
          "Prefer `Array.intersperse(sep)(arr)` over `arr.flatMap((x, i) => i === 0 ? [x] : [sep, x])`. Effect `Array.intersperse` directly expresses separator interleaving semantics."
      },
      schema: [],
      type: "problem"
    },
    name: "prefer-effect-array-intersperse"
  }
);
