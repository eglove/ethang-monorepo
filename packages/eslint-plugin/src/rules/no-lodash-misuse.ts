import type { Record } from "effect";

import {
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";

import {
  getChildNodes,
  getMemberObject,
  isLodashChain,
  isMemberCallOn
} from "../utils/chain.ts";
import { isLodashFunction } from "../utils/lodash-api.ts";
import {
  isCallExpression,
  isFunctionExpression,
  isIdentifier,
  isMemberExpression,
  isThisExpression
} from "../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds =
  "noCommit" | "noDoubleUnwrap" | "noExtraArgs" | "noUnboundThis";

type Options = [];

const isLodashIdentifierCall = (node: TSESTree.CallExpression): boolean => {
  const { callee } = node;
  return isIdentifier(callee) && isLodashFunction(callee.name);
};

const LODASH_MAX_ARGS: Record<string, number> = {
  castArray: 1,
  clone: 1,
  cloneDeep: 1,
  cloneDeepWith: 2,
  cloneWith: 2,
  compact: 1,
  constant: 1,
  flatten: 1,
  flattenDeep: 1,
  flattenDepth: 2,
  head: 1,
  initial: 1,
  keyBy: 2,
  last: 1,
  reverse: 1,
  sample: 1,
  shuffle: 1,
  size: 1,
  sortBy: 2,
  tail: 1,
  take: 2,
  takeRight: 2,
  toInteger: 1,
  toNumber: 1,
  toPath: 1,
  toSafeInteger: 1,
  toString: 1,
  union: 2,
  uniqueId: 1,
  unzip: 1,
  unzipWith: 2,
  wrap: 2
};

const getMaxArguments = (name: string): null | number => {
  return Object.hasOwn(LODASH_MAX_ARGS, name)
    ? get(LODASH_MAX_ARGS, name)
    : null;
};

const hasUnboundThis = (_function: TSESTree.FunctionExpression): boolean => {
  let isFound = false;

  const walk = (node: TSESTree.Node) => {
    if (isFound) {
      return;
    }

    if (isThisExpression(node)) {
      isFound = true;
      return;
    }

    if (isFunctionExpression(node) && node !== _function) {
      return;
    }

    for (const child of getChildNodes(node)) {
      walk(child);
    }
  };

  walk(_function);

  return isFound;
};

const isBoundFunction = (node: TSESTree.Node): boolean => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee } = node;
  if (!isMemberExpression(callee)) {
    return false;
  }
  if (!isIdentifier(callee.property)) {
    return false;
  }
  return "bind" === callee.property.name;
};

const checkNoCommit = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  node: TSESTree.CallExpression
): void => {
  if (!isMemberCallOn(node, "commit")) {
    return;
  }

  const object = getMemberObject(node);
  if (null !== object && isCallExpression(object) && isLodashChain(object)) {
    context.report({ messageId: "noCommit", node });
  }
};

const checkNoDoubleUnwrap = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  node: TSESTree.CallExpression
): void => {
  if (!isMemberCallOn(node, "value")) {
    return;
  }

  const object = getMemberObject(node);
  if (
    null === object ||
    !isCallExpression(object) ||
    !isMemberCallOn(object, "value")
  ) {
    return;
  }

  const innerObject = getMemberObject(object);
  if (
    null !== innerObject &&
    isCallExpression(innerObject) &&
    isLodashChain(innerObject)
  ) {
    context.report({ messageId: "noDoubleUnwrap", node });
  }
};

const checkNoExtraArguments = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  node: TSESTree.CallExpression
): void => {
  const { callee } = node;
  if (!isIdentifier(callee) || !isLodashFunction(callee.name)) {
    return;
  }

  const maxArguments = getMaxArguments(callee.name);
  if (null !== maxArguments && node.arguments.length > maxArguments) {
    context.report({ messageId: "noExtraArgs", node });
  }
};

const checkNoUnboundThis = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  node: TSESTree.CallExpression
): void => {
  if (!isLodashIdentifierCall(node)) {
    return;
  }

  if (2 > node.arguments.length) {
    return;
  }

  const [, iteratee] = node.arguments;
  /* v8 ignore next -- arguments.length >= 2 checked above, so iteratee is never nil */
  if (isNil(iteratee)) {
    return;
  }

  // If the iteratee is a .bind() call, the function is bound — skip.
  if (isBoundFunction(iteratee)) {
    return;
  }

  if (!isFunctionExpression(iteratee)) {
    return;
  }

  const hasThisArgument = 2 < node.arguments.length;
  if (!hasThisArgument && hasUnboundThis(iteratee)) {
    context.report({ messageId: "noUnboundThis", node: iteratee });
  }
};

export const noLodashMisuseRule = createRule<Options, MessageIds>({
  create(context) {
    const listener: TSESLint.RuleListener = {
      CallExpression(node) {
        checkNoCommit(context, node);
        checkNoDoubleUnwrap(context, node);
        checkNoExtraArguments(context, node);
        checkNoUnboundThis(context, node);
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Detect common lodash misuse: calling .commit() on chains, double unwrap via .value().value(), passing extra arguments to single-arg functions, and using `this` in iteratees without binding."
    },
    messages: {
      noCommit:
        "Do not call `.commit()` on lodash chains. It is rarely needed and can lead to subtle bugs.",
      noDoubleUnwrap:
        "Do not call `.value()` twice on a lodash chain. The chain is already unwrapped after the first `.value()`.",
      noExtraArgs:
        "This lodash function does not accept this many arguments. Check the lodash documentation.",
      noUnboundThis:
        "`this` in a lodash iteratee is unbound. Pass a `thisArg` as the last argument or use `.bind()`."
    },
    schema: [],
    type: "problem"
  },
  name: "no-lodash-misuse"
});
