import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";

import { ensureEffectImport } from "./../utils/ast.ts";
import {
  isArrayExpression,
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isNewExpression,
  isSpreadElement
} from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds =
  "preferEffectAllocate" | "preferEffectArrayFromIterable" | "preferEffectMake";

type Options = [];

// Detect [...iter] pattern - array expression with single spread element
export const detectSpreadPattern = (node: TSESTree.Node) => {
  if (!isArrayExpression(node)) {
    return null;
  }
  const array = node;
  if (1 !== array.elements.length) {
    return null;
  }
  const element = array.elements[0];
  if (isNil(element) || !isSpreadElement(element)) {
    return null;
  }
  return array;
};

// Check callee is Array.from method access
const isArrayFromCallee = (callee: TSESTree.Expression) => {
  if (!isMemberExpression(callee)) {
    return false;
  }
  const member = callee;
  if (!isIdentifier(member.object) || "Array" !== member.object.name) {
    return false;
  }
  return isIdentifier(member.property) && "from" === member.property.name;
};

// Check node is Array.from({ length: n }, callback) pattern
// Returns match object with extracted AST nodes, or null if not matched
// eslint-disable-next-line sonar/cyclomatic-complexity -- complex pattern detection
export const detectArrayFromWithLengthObject = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return null;
  }
  const call = node;
  if (!isArrayFromCallee(call.callee)) {
    return null;
  }
  if (2 !== call.arguments.length) {
    return null;
  }

  const [firstArgument, secondArgument] = call.arguments;
  if (isNil(firstArgument) || isNil(secondArgument)) {
    return null;
  }
  // First arg must be object with { length: n }
  if (AST_NODE_TYPES.ObjectExpression !== firstArgument.type) {
    return null;
  }
  const object = firstArgument;
  if (1 !== object.properties.length) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
  const theProperty = object.properties[0]!;
  if (!("value" in theProperty) || !isIdentifier(theProperty.key)) {
    return null;
  }
  if ("length" !== theProperty.key.name) {
    return null;
  }
  // Second arg must be callback with at least 2 params
  if (
    AST_NODE_TYPES.ArrowFunctionExpression !== secondArgument.type &&
    AST_NODE_TYPES.FunctionExpression !== secondArgument.type
  ) {
    return null;
  }
  if (2 > secondArgument.params.length) {
    return null;
  }
  const lengthExpression = theProperty.value;
  return { call, callback: secondArgument, lengthExpression };
};

// Check node is [...Array(n)].map(fn) pattern
// eslint-disable-next-line sonar/cyclomatic-complexity -- complex pattern detection
export const isArraySpreadMapPattern = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return false;
  }
  const call = node;
  if (!isMemberExpression(call.callee)) {
    return false;
  }
  const member = call.callee;
  if (!isIdentifier(member.property) || "map" !== member.property.name) {
    return false;
  }
  // At this point callee is narrowed to MemberExpression with .map property
  const receiver = member.object;
  if (!isArrayExpression(receiver)) {
    return false;
  }
  const array = receiver;
  if (1 !== array.elements.length) {
    return false;
  }
  const element = array.elements[0];
  if (isNil(element) || !isSpreadElement(element)) {
    return false;
  }
  const spreadArgument = element.argument;
  // Must be Array(n) call - not new Array(n)
  if (!isCallExpression(spreadArgument)) {
    return false;
  }
  const innerCall = spreadArgument;
  return isIdentifier(innerCall.callee) && "Array" === innerCall.callee.name;
};

// Check node is new Array(n).fill(v) pattern
// eslint-disable-next-line sonar/cyclomatic-complexity -- complex pattern detection
export const detectAllocatePattern = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return null;
  }
  const call = node;
  if (!isMemberExpression(call.callee)) {
    return null;
  }
  const member = call.callee;
  if (!isIdentifier(member.property) || "fill" !== member.property.name) {
    return null;
  }
  // Must have exactly 1 argument (value only, no start/end)
  if (1 !== call.arguments.length) {
    return null;
  }
  const valueExpression = call.arguments[0];
  if (isNil(valueExpression)) {
    return null;
  }
  // Receiver must be new Array(n)
  const receiver = member.object;
  if (!isNewExpression(receiver)) {
    return null;
  }
  const newExpression = receiver;
  if (
    !isIdentifier(newExpression.callee) ||
    "Array" !== newExpression.callee.name
  ) {
    return null;
  }
  // Array should have exactly 1 argument (the length)
  if (1 !== newExpression.arguments.length) {
    return null;
  }
  const lengthArgument = newExpression.arguments[0];
  if (isNil(lengthArgument)) {
    return null;
  }
  return { arrayCall: newExpression, valueExpression };
};

// Extract Array.make fix details from a [...Array(n)].map(fn) pattern match
const extractMakeFixDetails = (node: TSESTree.CallExpression) => {
  const callee = node.callee;
  if (!isMemberExpression(callee)) {
    return null;
  }
  const member = callee;
  if (!isIdentifier(member.property) || "map" !== member.property.name) {
    return null;
  }
  const receiver = member.object;
  if (!isArrayExpression(receiver)) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
  const element = receiver.elements[0]!;
  if (!isSpreadElement(element)) {
    return null;
  }
  const spreadArgument = element.argument;
  if (AST_NODE_TYPES.CallExpression !== spreadArgument.type) {
    return null;
  }
  const arrayCall = spreadArgument;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
  const lengthArgument = arrayCall.arguments[0]!;
  const mapCallback = node.arguments[0];
  if (
    !mapCallback ||
    (AST_NODE_TYPES.ArrowFunctionExpression !== mapCallback.type &&
      AST_NODE_TYPES.FunctionExpression !== mapCallback.type)
  ) {
    return null;
  }
  return {
    call: node,
    callback: mapCallback,
    lengthExpression: lengthArgument
  };
};

export const preferEffectArrayFromIterableRule = createRule<
  Options,
  MessageIds
>({
  create(context) {
    const { sourceCode } = context;
    // Track ArrayExpressions that are part of a [...Array(n)].map() pattern
    // to avoid double-reporting
    const handledSpreadArrays = new WeakSet<TSESTree.ArrayExpression>();
    const program = sourceCode.ast;

    return {
      ArrayExpression: (node: TSESTree.ArrayExpression) => {
        const spread = detectSpreadPattern(node);
        if (isNil(spread)) {
          return;
        }
        // Skip if this is part of a [...Array(n)].map() pattern - handled by CallExpression
        if (handledSpreadArrays.has(node)) {
          return;
        }
        // Don't autofix if the spread argument could have side effects
        const element = spread.elements[0];
        if (!isNil(element) && isSpreadElement(element)) {
          const spreadElement = element;
          if (AST_NODE_TYPES.CallExpression === spreadElement.argument.type) {
            context.report({
              messageId: "preferEffectArrayFromIterable",
              node
            });
            return;
          }
          // Safe to autofix - simple identifier or member expression
          const iterExpression = spreadElement.argument;
          const isSafeIter =
            isIdentifier(iterExpression) || isMemberExpression(iterExpression);
          if (isSafeIter) {
            const iterText = sourceCode.getText(iterExpression);
            context.report({
              fix: (fixer) => {
                const replace = fixer.replaceText(
                  node,
                  `Array.fromIterable(${iterText})`
                );
                const importFix = ensureEffectImport(program, fixer);
                return importFix ? [replace, importFix] : replace;
              },
              messageId: "preferEffectArrayFromIterable",
              node
            });
          } else {
            context.report({
              messageId: "preferEffectArrayFromIterable",
              node
            });
          }
        }
      },
      // eslint-disable-next-line sonar/cyclomatic-complexity -- complex AST traversal
      CallExpression: (node: TSESTree.CallExpression) => {
        // Check for [...Array(n)].map(fn) pattern first - mark the inner ArrayExpression
        if (isArraySpreadMapPattern(node)) {
          const callee = node.callee;
          if (!isMemberExpression(callee)) {
            return;
          }
          const member = callee;
          if (
            !isIdentifier(member.property) ||
            "map" !== member.property.name
          ) {
            return;
          }
          const receiver = member.object;
          if (!isArrayExpression(receiver)) {
            return;
          }
          handledSpreadArrays.add(receiver);
        }

        // Check for Array.from(iterable) pattern
        if (isArrayFromCallee(node.callee) && 1 === node.arguments.length) {
          const iterable = node.arguments[0];
          if (!isNil(iterable)) {
            context.report({
              fix: (fixer) => {
                const replace = fixer.replaceText(
                  node,
                  `Array.fromIterable(${sourceCode.getText(iterable)})`
                );
                const importFix = ensureEffectImport(program, fixer);
                return importFix ? [replace, importFix] : replace;
              },
              messageId: "preferEffectArrayFromIterable",
              node
            });
            return;
          }
        }

        // Check for Array.from({length:n}, callback) pattern
        const makeMatch = detectArrayFromWithLengthObject(node);
        if (!isNil(makeMatch)) {
          const { call, callback, lengthExpression } = makeMatch;
          const lengthText = sourceCode.getText(lengthExpression);
          const callbackText = sourceCode.getText(callback);
          context.report({
            fix: (fixer) => {
              const replace = fixer.replaceText(
                call,
                `Array.makeBy(${lengthText}, ${callbackText})`
              );
              const importFix = ensureEffectImport(program, fixer);
              return importFix ? [replace, importFix] : replace;
            },
            messageId: "preferEffectMake",
            node: call
          });
          return;
        }

        // Check for [...Array(n)].map(fn) pattern
        const spreadMapDetails = extractMakeFixDetails(node);
        if (!isNil(spreadMapDetails)) {
          const { callback, lengthExpression } = spreadMapDetails;
          const lengthText = sourceCode.getText(lengthExpression);
          const callbackText = sourceCode.getText(callback);
          context.report({
            fix: (fixer) => {
              const replace = fixer.replaceText(
                node,
                `Array.makeBy(${lengthText}, ${callbackText})`
              );
              const importFix = ensureEffectImport(program, fixer);
              return importFix ? [replace, importFix] : replace;
            },
            messageId: "preferEffectMake",
            node
          });
          return;
        }

        // Check for new Array(n).fill(v) pattern
        const allocateMatch = detectAllocatePattern(node);
        if (!isNil(allocateMatch)) {
          const { arrayCall, valueExpression } = allocateMatch;
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
          const lengthArgument = arrayCall.arguments[0]!;
          const lengthText = sourceCode.getText(lengthArgument);
          const valueText = sourceCode.getText(valueExpression);
          context.report({
            fix: (fixer) => {
              const replace = fixer.replaceText(
                node,
                `Array.allocate(${lengthText})(${valueText})`
              );
              const importFix = ensureEffectImport(program, fixer);
              return importFix ? [replace, importFix] : replace;
            },
            messageId: "preferEffectAllocate",
            node
          });
        }
      }
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer Effect Array methods over native array creation patterns."
    },
    fixable: "code",
    messages: {
      preferEffectAllocate:
        "Prefer `Array.allocate(n)(v)` over `new Array(n).fill(v)`. Effect `Array.allocate` directly expresses pre-allocated array semantics.",
      preferEffectArrayFromIterable:
        "Prefer `Array.fromIterable(iter)` over `[...iter]` or `Array.from(iterable)`. Effect `Array.fromIterable` directly expresses iterable-to-array conversion semantics.",
      preferEffectMake:
        "Prefer `Array.make(n, fn)` over `Array.from({length:n}, (_, i) => fn(i))` or `[...Array(n)].map(fn)`. Effect `Array.make` directly expresses array creation with a generator function."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-effect-array-from-iterable"
});
