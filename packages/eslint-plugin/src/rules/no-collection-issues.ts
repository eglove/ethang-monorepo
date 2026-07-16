import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import find from "lodash/find.js";
import isNil from "lodash/isNil.js";

import {
  countChainMethods,
  getChildNodes,
  getMemberObject,
  isLodashChain,
  isMemberCallOn
} from "../utils/chain.ts";
import { isLodashFunction, lodashApi } from "../utils/lodash-api.ts";
import {
  isArrowFunctionExpression,
  isBlockStatement,
  isCallExpression,
  isFunctionExpression,
  isIdentifier,
  isMemberExpression,
  isReturnStatement
} from "../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "collectionMethodValue" | "noCollectionReturn" | "unwrap";

type Options = [];

// Collection methods that require their iteratee to return a value.
const COLLECTION_RETURN_METHODS = new Set([
  "countBy",
  "every",
  "filter",
  "find",
  "findLast",
  "flatMap",
  "flatMapDeep",
  "flatMapDepth",
  "groupBy",
  "keyBy",
  "map",
  "orderBy",
  "partition",
  "reduce",
  "reduceRight",
  "reject",
  "sample",
  "sampleSize",
  "shuffle",
  "some",
  "sortBy"
]);

// Methods that do NOT require a return value from the iteratee.
const NO_RETURN_METHODS = new Set([
  "each",
  "eachRight",
  "forEach",
  "forEachRight"
]);

// Check if the iteratee of a collection method should return a value.
const requiresReturnValue = (methodName: string) => {
  return (
    COLLECTION_RETURN_METHODS.has(methodName) &&
    !NO_RETURN_METHODS.has(methodName)
  );
};

const getMethodName = (callee: TSESTree.Expression) => {
  if (isIdentifier(callee)) {
    return callee.name;
  }

  if (isMemberExpression(callee) && isIdentifier(callee.property)) {
    return callee.property.name;
  }

  return null;
};

// Check if a function body always returns a value.
const hasReturnValue = (
  _function: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
) => {
  const { body } = _function;

  // Arrow function with expression body — always returns.
  if (!isBlockStatement(body)) {
    return true;
  }

  // Check for return statements in the function body.
  const hasReturn = (node: TSESTree.Node) => {
    if (isReturnStatement(node)) {
      return true;
    }

    // Don't descend into nested functions.
    if (
      (isFunctionExpression(node) || isArrowFunctionExpression(node)) &&
      node !== _function
    ) {
      return false;
    }

    for (const child of getChildNodes(node)) {
      if (hasReturn(child)) {
        return true;
      }
    }
    return false;
  };

  return hasReturn(body);
};

const checkCollectionReturn = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  node: TSESTree.CallExpression
) => {
  const { callee } = node;

  // Get method name from identifier call or member call.
  const methodName = getMethodName(callee);

  if (isNil(methodName) || !requiresReturnValue(methodName)) {
    return;
  }

  // Get the iteratee (first function argument).
  const iteratee = find(node.arguments, (argument) => {
    return (
      isFunctionExpression(argument) || isArrowFunctionExpression(argument)
    );
  });

  if (isNil(iteratee)) {
    return;
  }

  if (!hasReturnValue(iteratee)) {
    context.report({
      data: { method: methodName },
      messageId: "noCollectionReturn",
      node: iteratee
    });
  }
};

const checkUnwrap = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  node: TSESTree.CallExpression
) => {
  if (!isMemberCallOn(node, "value")) {
    return;
  }

  const object = getMemberObject(node);
  if (isNil(object) || !isCallExpression(object)) {
    return;
  }

  // Only report if the chain has a single method (value() is unnecessary).
  const methodCount = countChainMethods(object);
  if (1 === methodCount && isLodashChain(object)) {
    context.report({ messageId: "unwrap", node });
  }
};

const checkCollectionMethodValue = (
  context: TSESLint.RuleContext<MessageIds, Options>,
  node: TSESTree.CallExpression
) => {
  const { callee } = node;

  // Must be a member call (e.g. _(xs).map(fn)).
  if (!isMemberExpression(callee) || !isIdentifier(callee.property)) {
    return;
  }

  const methodName = callee.property.name;

  // Only check chain methods.
  if (!isLodashFunction(methodName)) {
    return;
  }

  const entry = lodashApi[methodName];
  if ("seq" === entry.category) {
    return;
  }

  // Only check if this is a chained call (object is a CallExpression,
  // not a direct _.method() call).
  if (!isCallExpression(callee.object)) {
    return;
  }

  // Check if the chain traces back to a chain starter.
  if (!isLodashChain(node)) {
    return;
  }

  // Check if this chain call's result is used (i.e., not just a statement).
  const { parent } = node;
  /* v8 ignore next -- AST nodes always have a parent in RuleTester */
  if (isNil(parent)) {
    return;
  }

  // If the parent is an ExpressionStatement, the chain is not consumed.
  if (AST_NODE_TYPES.ExpressionStatement === parent.type) {
    context.report({ messageId: "collectionMethodValue", node });
  }
};

export const noCollectionIssuesRule = createRule<Options, MessageIds>({
  create(context) {
    const listener: TSESLint.RuleListener = {
      CallExpression(node) {
        checkCollectionReturn(context, node);
        checkUnwrap(context, node);
        checkCollectionMethodValue(context, node);
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Detects lodash collection issues: missing return values, unnecessary unwrap, and chain method values used outside chains.",
      url: "https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/no-collection-issues.ts"
    },
    messages: {
      collectionMethodValue:
        "Chain method result is not used. Use .value() to unwrap the chain or assign the result.",
      noCollectionReturn:
        "Iteratee should return a value for collection method '{{method}}'.",
      unwrap: "Unnecessary .value() call for a single-method chain."
    },
    schema: [],
    type: "problem"
  },
  name: "no-collection-issues"
});
