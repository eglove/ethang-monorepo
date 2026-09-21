import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

import { getChildNodes } from "./../utils/ast.ts";
import {
  isArrowFunctionExpression,
  isCallExpression,
  isIdentifier,
  isMemberExpression
} from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashFindKey";

type Options = [];

// `Object.keys(IDENT).find(...)` is the canonical shape this rule rewrites.
// `Object.keys` must be the literal global — any other receiver
// (`Reflect.ownKeys`, a user-defined `keys` function) is out of scope.
export const isObjectKeysCall = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee } = node;
  if (!isMemberExpression(callee) || callee.computed) {
    return false;
  }
  const { object } = callee;
  if (!isIdentifier(object)) {
    return false;
  }
  const { property } = callee;
  return (
    isIdentifier(property) &&
    "Object" === object.name &&
    "keys" === property.name
  );
};

export const isFindCall = (node: TSESTree.Node) => {
  if (!isCallExpression(node)) {
    return false;
  }
  const { callee } = node;
  if (!isMemberExpression(callee) || callee.computed) {
    return false;
  }
  const { property } = callee;
  return isIdentifier(property) && "find" === property.name;
};

export const getMemberExpressionCallee = (node: TSESTree.CallExpression) => {
  return isMemberExpression(node.callee) ? node.callee : null;
};

export const getFindCallTarget = (node: TSESTree.Node) => {
  return !isCallExpression(node) || !isFindCall(node)
    ? null
    : getMemberExpressionCallee(node);
};

// An identifier whose name matches exactly — used twice when validating the
// `obj[param]` access shape below.
const isNamedIdentifier = (
  node: TSESTree.Node,
  name: string
): node is TSESTree.Identifier => {
  return isIdentifier(node) && node.name === name;
};

// Computed-member shape `<objectName>[<parameterName>]` — the only form
// the rewrite can mechanically turn into `v` in `findKey(obj, v => v ...)`.
export const isObjectParameterAccess = (
  node: TSESTree.Node,
  objectName: string,
  parameterName: string
): node is TSESTree.MemberExpression => {
  return (
    isMemberExpression(node) &&
    node.computed &&
    isNamedIdentifier(node.object, objectName) &&
    isNamedIdentifier(node.property, parameterName)
  );
};

// True iff `body` references the parameter identifier *outside* of an
// `obj[param]` access. Such uses mean the user is treating the parameter
// as a key (e.g. `k.startsWith('a')`); rewriting to `findKey(obj, v => ...)`
// would flip key/value semantics, so we leave these alone.
export const bodyUsesParameterOutsideObjectAccess = (
  body: TSESTree.Node,
  objectName: string,
  parameterName: string
) => {
  let hasFreeUse = false;

  const visit = (node: TSESTree.Node) => {
    if (hasFreeUse) {
      return;
    }
    if (isIdentifier(node) && node.name === parameterName) {
      hasFreeUse = true;
      return;
    }
    if (isObjectParameterAccess(node, objectName, parameterName)) {
      // The `parameterName` here is the property side of an access —
      // never a free reference to the parameter, so don't descend.
      return;
    }
    for (const child of getChildNodes(node)) {
      visit(child);
    }
  };

  visit(body);
  return hasFreeUse;
};

// Collect every `obj[param]` access in `body` so the fixer can rewrite
// each to `v`. Nested accesses (`obj[param].foo[param]`) collect both;
// sorting by range descending in the fixer keeps positions stable.
export const collectObjectParameterAccesses = (
  body: TSESTree.Node,
  objectName: string,
  parameterName: string
) => {
  const accesses: TSESTree.MemberExpression[] = [];

  const visit = (node: TSESTree.Node) => {
    if (isObjectParameterAccess(node, objectName, parameterName)) {
      accesses.push(node);
      return;
    }
    for (const child of getChildNodes(node)) {
      visit(child);
    }
  };

  visit(body);
  return accesses;
};

export type FindKeyMatch = {
  readonly accesses: readonly TSESTree.MemberExpression[];
  readonly callback: TSESTree.ArrowFunctionExpression;
  readonly objectArgument: TSESTree.Identifier;
  readonly parameter: TSESTree.Identifier;
};

export const getSingleIdentifierArrowParameter = (
  callback: TSESTree.ArrowFunctionExpression
) => {
  const [first] = callback.params;
  return !first || 1 !== callback.params.length || !isIdentifier(first)
    ? null
    : first;
};

export const getExpressionBody = (
  callback: TSESTree.ArrowFunctionExpression
) => {
  return AST_NODE_TYPES.BlockStatement === callback.body.type
    ? null
    : callback.body;
};

export const getFirstIdentifierArgument = (node: TSESTree.CallExpression) => {
  const [first] = node.arguments;
  return !first || !isIdentifier(first) ? null : first;
};

export const getFirstArrowCallbackArgument = (
  node: TSESTree.CallExpression
) => {
  const [first] = node.arguments;
  return !first || !isArrowFunctionExpression(first) ? null : first;
};

export const resolveObjectKeysInner = (innerCall: TSESTree.Node) => {
  if (!isObjectKeysCall(innerCall) || !isCallExpression(innerCall)) {
    return null;
  }
  const objectArgument = getFirstIdentifierArgument(innerCall);
  return objectArgument ? { objectArgument } : null;
};

export const getSafeBodyAccesses = (
  body: TSESTree.Expression,
  objectName: string,
  parameterName: string
) => {
  const accesses = collectObjectParameterAccesses(
    body,
    objectName,
    parameterName
  );
  return 0 === accesses.length ||
    bodyUsesParameterOutsideObjectAccess(body, objectName, parameterName)
    ? null
    : accesses;
};

export const detectFindKeyPattern = (node: TSESTree.CallExpression) => {
  if (!isFindCall(node)) {
    return null;
  }
  const outerCallee = getFindCallTarget(node);

  if (!outerCallee) {
    return null;
  }
  const innerCall = outerCallee.object;
  const resolvedInner = resolveObjectKeysInner(innerCall);
  if (!resolvedInner) {
    return null;
  }
  const callback = getFirstArrowCallbackArgument(node);
  if (!callback) {
    return null;
  }
  const parameter = getSingleIdentifierArrowParameter(callback);
  if (!parameter) {
    return null;
  }
  const body = getExpressionBody(callback);
  if (!body) {
    return null;
  }
  const accesses = getSafeBodyAccesses(
    body,
    resolvedInner.objectArgument.name,
    parameter.name
  );
  if (!accesses) {
    return null;
  }
  return {
    accesses,
    callback,
    objectArgument: resolvedInner.objectArgument,
    parameter
  };
};

const buildFixes = (
  fixer: TSESLint.RuleFixer,
  outerNode: TSESTree.CallExpression,
  match: FindKeyMatch,
  objectText: string
) => {
  const { accesses, callback, parameter } = match;
  // Replace highest range first so earlier position shifts don't
  // invalidate later replacements.
  const sortedAccesses = accesses.toSorted((a, b) => {
    return b.range[0] - a.range[0];
  });
  const accessFixes = sortedAccesses.map((access) => {
    return fixer.replaceText(access, "v");
  });
  const parameterFix = fixer.replaceText(parameter, "v");
  const headFix = fixer.replaceTextRange(
    [outerNode.range[0], callback.range[0]],
    `findKey(${objectText}, `
  );
  return [...accessFixes, parameterFix, headFix];
};

export const preferLodashFindKeyRule = createRule<Options, MessageIds>({
  create(context) {
    const { sourceCode } = context;

    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        const match = detectFindKeyPattern(node);
        if (!match) {
          return;
        }
        const objectText = sourceCode.getText(match.objectArgument);
        context.report({
          fix: (fixer) => {
            return buildFixes(fixer, node, match, objectText);
          },
          messageId: "preferLodashFindKey",
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
        "Prefer `_.findKey` over `Object.keys(o).find(k => o[k] ...)`."
    },
    fixable: "code",
    messages: {
      preferLodashFindKey:
        "Prefer `_.findKey(object, v => v ...)` over `Object.keys(object).find(k => object[k] ...)`. Lodash iterates the values directly and returns the matching key."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-find-key"
});
