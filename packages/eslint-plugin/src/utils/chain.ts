import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import filter from "lodash/filter.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";
import toPairs from "lodash/toPairs.js";

import { isChainableMethod, isChainBreakerMethod } from "./method-data.ts";
import {
  isCallExpression,
  isIdentifier,
  isMemberExpression
} from "./type-guards.ts";

const CHAIN_STARTERS = new Set(["_", "chain", "lodash"]);

export const isChainStarter = (name: string): boolean => {
  return CHAIN_STARTERS.has(name);
};

export const isChainStarterCall = (node: TSESTree.CallExpression): boolean => {
  const { callee } = node;
  /* v8 ignore next -- isLodashChain is only called on member calls, never direct identifier calls */
  return isIdentifier(callee) && isChainStarter(callee.name);
};

export const isMemberCallOn = (
  node: TSESTree.CallExpression,
  methodName: string
): boolean => {
  const { callee } = node;
  return (
    isMemberExpression(callee) &&
    isIdentifier(callee.property) &&
    callee.property.name === methodName
  );
};

export const getMemberObject = (
  node: TSESTree.CallExpression
): null | TSESTree.Expression => {
  const { callee } = node;
  /* v8 ignore next -- always called after isMemberCallOn confirms MemberExpression */
  if (!isMemberExpression(callee)) {
    return null;
  }
  return callee.object;
};

// Trace back through a chain of method calls to see if the root is a chain
// starter like _(arr), chain(arr), or lodash(arr).
export const isTraceableToChainStarter = (
  node: TSESTree.CallExpression
): boolean => {
  let current: TSESTree.Node = node;
  while (isCallExpression(current)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const { callee } = current as TSESTree.CallExpression;

    /* v8 ignore next -- isChainStarterCall already handles identifier chain starters */
    if (isIdentifier(callee) && isChainStarter(callee.name)) {
      return true;
    }

    if (!isMemberExpression(callee)) {
      return false;
    }

    if (isIdentifier(callee.object) && isChainStarter(callee.object.name)) {
      return true;
    }

    current = callee.object;
  }
  return false;
};

export const isLodashChain = (node: TSESTree.CallExpression): boolean => {
  return isChainStarterCall(node) || isTraceableToChainStarter(node);
};

// Check if a callee is a chain starter or traces to one at the top level.
const isCalleeChainStarter = (callee: TSESTree.Expression): boolean => {
  if (isIdentifier(callee) && isChainStarter(callee.name)) {
    return true;
  }

  if (isMemberExpression(callee) && isIdentifier(callee.object)) {
    return isChainStarter(callee.object.name);
  }

  return false;
};

// Count chain methods (e.g. .map(fn).filter(fn) = 2 chain methods).
export const countChainMethods = (node: TSESTree.CallExpression): number => {
  let count = 0;
  let current: TSESTree.Node = node;
  while (isCallExpression(current)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const call = current as TSESTree.CallExpression;
    const { callee } = call;

    // Stop when we reach a chain starter or a non-member call.
    if (isCalleeChainStarter(callee) || !isMemberExpression(callee)) {
      break;
    }

    count += 1;
    current = callee.object;
  }
  return count;
};

// --- AST traversal helpers ---

const SKIP_KEYS = new Set(["loc", "parent", "range", "type"]);

export const isNodeLike = (value: unknown): value is TSESTree.Node => {
  return !isNil(value) && isObject(value) && "type" in value;
};

export const extractNodesFromValue = (value: unknown): TSESTree.Node[] => {
  if (!isArray(value)) {
    return isNodeLike(value) ? [value] : [];
  }
  return flatMap(value, (item) => {
    /* v8 ignore next -- TSESTree arrays contain only nodes or null (handled by isNodeLike) */
    return isNodeLike(item) ? [item] : [];
  });
};

export const getChildNodes = (node: TSESTree.Node): TSESTree.Node[] => {
  const entries = toPairs(node) as [string, unknown][];
  return flatMap(
    filter(entries, ([key]) => {
      return !SKIP_KEYS.has(key);
    }),
    ([, value]) => {
      return extractNodesFromValue(value);
    }
  );
};

// --- Chain detection for composition-style and explicit chaining ---

// Gets the method name from a CallExpression. For member expressions
// (`obj.method()`), returns the property name. For identifier calls
// (`method()`), returns the identifier name.
export const getMethodName = (node: TSESTree.CallExpression): null | string => {
  if (isMemberExpression(node.callee)) {
    if (isIdentifier(node.callee.property)) {
      return node.callee.property.name;
    }

    if (
      AST_NODE_TYPES.Literal === node.callee.property.type &&
      isString(node.callee.property.value)
    ) {
      return node.callee.property.value;
    }
  }

  if (isIdentifier(node.callee)) {
    return node.callee.name;
  }

  return null;
};

// Gets the callee object of a member-expression call.
export const getCaller = (
  node: TSESTree.CallExpression
): null | TSESTree.Expression => {
  if (isMemberExpression(node.callee)) {
    return node.callee.object;
  }

  return null;
};

// Returns true if the node is a method call (member expression callee).
export const isMethodCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  return isCallExpression(node) && isMemberExpression(node.callee);
};

// Returns true if the node is the object of a member-expression call.
export const isObjectOfMethodCall = (node: TSESTree.Node): boolean => {
  const { parent } = node;
  if (parent === undefined || !isMemberExpression(parent)) {
    return false;
  }
  const { parent: grandParent } = parent;
  return parent.object === node && isCallExpression(grandParent);
};

// Returns true if the call is to the `chain` method (explicit chain start).
export const isExplicitChainStart = (
  node: TSESTree.CallExpression
): boolean => {
  return isIdentifier(node.callee) && "chain" === node.callee.name;
};

// Returns true if the method call is a chain breaker (e.g. `value()`).
export const isChainBreaker = (node: TSESTree.CallExpression): boolean => {
  if (!isMethodCall(node)) {
    return false;
  }

  const name = getMethodName(node);

  if (null === name) {
    return false;
  }

  return isChainBreakerMethod(name);
};

// Returns true if the method call is chainable.
export const isChainable = (node: TSESTree.CallExpression): boolean => {
  if (!isMethodCall(node)) {
    return false;
  }

  const name = getMethodName(node);

  if (null === name) {
    return false;
  }

  return isChainableMethod(name);
};

// Walks up the chain from a chain start and returns the end node.
// For explicit chains, the end includes the chain breaker (e.g. `value()`).
// For implicit chains, the end is the last chainable method.
const getNextInChain = (
  current: TSESTree.CallExpression,
  isStillInChain: (node: TSESTree.CallExpression) => boolean
): TSESTree.CallExpression | undefined => {
  const { parent: currentParent } = current;
  if (
    isNil(currentParent) ||
    currentParent.parent === undefined ||
    !isCallExpression(currentParent.parent)
  ) {
    return undefined;
  }
  const next = currentParent.parent;
  if (getCaller(next) !== current || !isStillInChain(current)) {
    return undefined;
  }
  return next;
};

export const getEndOfChain = (
  startNode: TSESTree.CallExpression,
  isExplicit: boolean
): TSESTree.CallExpression => {
  const isStillInChain = isExplicit
    ? (node: TSESTree.CallExpression) => {
        return !isChainBreaker(node);
      }
    : (node: TSESTree.CallExpression) => {
        return isChainable(node);
      };

  const { parent } = startNode;

  if (
    isNil(parent) ||
    parent.parent === undefined ||
    !isCallExpression(parent.parent)
  ) {
    return startNode;
  }

  let current: TSESTree.CallExpression = parent.parent;

  for (;;) {
    const next = getNextInChain(current, isStillInChain);
    if (next === undefined) {
      break;
    }
    current = next;
  }

  return current;
};

// Returns true if the node is a call to the specified method name.
export const isCallToMethod = (
  node: TSESTree.CallExpression,
  method: string
): boolean => {
  const name = getMethodName(node);

  if (null === name) {
    return false;
  }

  return method === name;
};
import flatMap from "lodash/flatMap.js";
