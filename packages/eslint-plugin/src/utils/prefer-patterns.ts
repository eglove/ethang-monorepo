import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import every from "lodash/every.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

import { isLodashFunction } from "./lodash-api.ts";
import {
  isArrowFunctionExpression,
  isBlockStatement,
  isCallExpression,
  isExpressionStatement,
  isFunctionExpression,
  isIdentifier,
  isMemberExpression,
  isReturnStatement
} from "./type-guards.ts";

// --- prefer-is-nil ---

type FunctionLike =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

const isNullOrUndefinedLiteral = (node: TSESTree.Node): boolean => {
  if (AST_NODE_TYPES.Literal === node.type && null === node.value) {
    return true;
  }
  return AST_NODE_TYPES.Identifier === node.type && "undefined" === node.name;
};

const isTypeofUndefinedComparison = (
  node: TSESTree.BinaryExpression
): boolean => {
  /* v8 ignore if -- defensive guard: shouldPreferIsNil only passes === comparisons */
  if ("===" !== node.operator) {
    return false;
  }

  // typeof x === 'undefined'
  if (
    AST_NODE_TYPES.UnaryExpression === node.left.type &&
    "typeof" === node.left.operator &&
    AST_NODE_TYPES.Literal === node.right.type &&
    "undefined" === node.right.value
  ) {
    return true;
  }

  // 'undefined' === typeof x
  return (
    AST_NODE_TYPES.Literal === node.left.type &&
    "undefined" === node.left.value &&
    AST_NODE_TYPES.UnaryExpression === node.right.type &&
    "typeof" === node.right.operator
  );
};

const isNullOrUndefinedComparison = (
  node: TSESTree.BinaryExpression
): boolean => {
  if (
    isNullOrUndefinedLiteral(node.left) ||
    isNullOrUndefinedLiteral(node.right)
  ) {
    return true;
  }
  return isTypeofUndefinedComparison(node);
};

export const shouldPreferIsNil = (
  node: TSESTree.LogicalExpression
): boolean => {
  if ("||" !== node.operator) {
    return false;
  }

  const checks: TSESTree.Node[] = [node.left, node.right];

  return every(checks, (check) => {
    return (
      AST_NODE_TYPES.BinaryExpression === check.type &&
      "===" === check.operator &&
      isNullOrUndefinedComparison(check)
    );
  });
};

// --- prefer-lodash-typecheck ---

const TYPECHECK_MAP: Record<string, string> = {
  boolean: "isBoolean",
  function: "isFunction",
  number: "isNumber",
  object: "isObject",
  string: "isString"
};

const isTypeofExpression = (expression: TSESTree.Node): boolean => {
  return (
    AST_NODE_TYPES.UnaryExpression === expression.type &&
    "typeof" === expression.operator
  );
};

const getTypecheckLiteral = (expression: TSESTree.Node): null | string => {
  if (
    AST_NODE_TYPES.Literal === expression.type &&
    isString(expression.value)
  ) {
    const { value } = expression;
    /* v8 ignore next -- defensive guard: TYPECHECK_MAP values are always non-null strings */
    return Object.hasOwn(TYPECHECK_MAP, value)
      ? (TYPECHECK_MAP[value] ?? null)
      : null;
  }
  return null;
};

export const resolvePreferTypecheck = (
  node: TSESTree.BinaryExpression
): null | string => {
  if ("===" !== node.operator && "!==" !== node.operator) {
    return null;
  }

  if (isTypeofExpression(node.left)) {
    return getTypecheckLiteral(node.right);
  }

  if (isTypeofExpression(node.right)) {
    return getTypecheckLiteral(node.left);
  }

  return null;
};

// --- prefer-includes ---

export const resolvePreferIncludes = (
  node: TSESTree.BinaryExpression
): "preferIncludes" | "preferIncludesNegated" | null => {
  if ("!==" === node.operator && isIndexOfNegatedOne(node)) {
    return "preferIncludes";
  }
  if (">=" === node.operator && isIndexOfGteZero(node)) {
    return "preferIncludes";
  }
  if ("===" === node.operator && isIndexOfNegatedOne(node)) {
    return "preferIncludesNegated";
  }
  return null;
};

const isIndexOfCall = (expression: TSESTree.Node): boolean => {
  return (
    isCallExpression(expression) &&
    isMemberExpression(expression.callee) &&
    isIdentifier(expression.callee.property) &&
    "indexOf" === expression.callee.property.name
  );
};

const isNegativeOneLiteral = (expression: TSESTree.Node): boolean => {
  return (
    AST_NODE_TYPES.UnaryExpression === expression.type &&
    "-" === expression.operator &&
    AST_NODE_TYPES.Literal === expression.argument.type &&
    1 === expression.argument.value
  );
};

const isZeroLiteral = (expression: TSESTree.Node): boolean => {
  return AST_NODE_TYPES.Literal === expression.type && 0 === expression.value;
};

const isIndexOfNegatedOne = (node: TSESTree.BinaryExpression): boolean => {
  return (
    (isIndexOfCall(node.left) && isNegativeOneLiteral(node.right)) ||
    (isIndexOfCall(node.right) && isNegativeOneLiteral(node.left))
  );
};

const isIndexOfGteZero = (node: TSESTree.BinaryExpression): boolean => {
  return isIndexOfCall(node.left) && isZeroLiteral(node.right);
};

// --- prefer-startswith ---

export const shouldPreferStartsWith = (
  node: TSESTree.BinaryExpression
): boolean => {
  if ("===" === node.operator && isIndexOfZero(node)) {
    return true;
  }
  return "<" === node.operator && isIndexOfLtOne(node);
};

const isIndexOfZero = (node: TSESTree.BinaryExpression): boolean => {
  return (
    (isIndexOfCall(node.left) && isZeroLiteral(node.right)) ||
    (isIndexOfCall(node.right) && isZeroLiteral(node.left))
  );
};

const isOneLiteral = (expression: TSESTree.Node): boolean => {
  return AST_NODE_TYPES.Literal === expression.type && 1 === expression.value;
};

const isIndexOfLtOne = (node: TSESTree.BinaryExpression): boolean => {
  return isIndexOfCall(node.left) && isOneLiteral(node.right);
};

// --- prefer-compact ---

const isBooleanIdentifier = (node: TSESTree.Node): boolean => {
  /* v8 ignore next -- branch: isIdentifier false short-circuits the && */
  return isIdentifier(node) && "Boolean" === node.name;
};

const getReturnedValue = (
  _function: FunctionLike
): null | TSESTree.Expression => {
  if (isBlockStatement(_function.body)) {
    if (1 !== _function.body.body.length) {
      return null;
    }
    const first = _function.body.body.at(0);
    /* v8 ignore if -- defensive guard: length check ensures first exists */
    if (isNil(first)) {
      return null;
    }
    if (isReturnStatement(first) && null !== first.argument) {
      return first.argument;
    }
    return null;
  }
  return _function.body;
};

const isBooleanCast = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  return isCallExpression(node) && isBooleanIdentifier(node.callee);
};

const isCastingFirstParameter = (
  node: TSESTree.CallExpression,
  parameter: TSESTree.Identifier
): boolean => {
  const argument = node.arguments.at(0);
  return (
    !isNil(argument) &&
    isIdentifier(argument) &&
    argument.name === parameter.name
  );
};

const isDoubleNegationOfParameter = (
  node: TSESTree.Node,
  parameter: TSESTree.Identifier
): boolean => {
  if (AST_NODE_TYPES.UnaryExpression !== node.type || "!" !== node.operator) {
    return false;
  }
  const inner = node.argument;
  if (AST_NODE_TYPES.UnaryExpression !== inner.type || "!" !== inner.operator) {
    return false;
  }
  return isIdentifier(inner.argument) && inner.argument.name === parameter.name;
};

const isFirstParameterBooleanCasting = (
  _function: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
): boolean => {
  const returned = getReturnedValue(_function);
  if (null === returned) {
    return false;
  }

  const parameter = _function.params.at(0);
  if (isNil(parameter) || !isIdentifier(parameter)) {
    return false;
  }

  // Boolean(x)
  if (isBooleanCast(returned) && isCastingFirstParameter(returned, parameter)) {
    return true;
  }

  // !!x
  if (isDoubleNegationOfParameter(returned, parameter)) {
    return true;
  }

  return false;
};

const isLodashMemberCall = (node: TSESTree.CallExpression): boolean => {
  return (
    isMemberExpression(node.callee) &&
    isIdentifier(node.callee.object) &&
    "_" === node.callee.object.name
  );
};

export const shouldPreferCompact = (node: TSESTree.CallExpression): boolean => {
  if (!isMemberCallOnNamed(node, "filter")) {
    return false;
  }

  const iterateeIndex = isLodashMemberCall(node) ? 1 : 0;
  const iteratee = node.arguments.at(iterateeIndex);

  if (isNil(iteratee)) {
    return false;
  }

  if (isBooleanIdentifier(iteratee)) {
    return true;
  }

  if (
    (isArrowFunctionExpression(iteratee) || isFunctionExpression(iteratee)) &&
    isFirstParameterBooleanCasting(iteratee)
  ) {
    return true;
  }

  return false;
};

// --- prefer-some ---

export const shouldPreferSome = (node: TSESTree.BinaryExpression): boolean => {
  if ("!==" === node.operator && isFindIndexCall(node.left)) {
    return isNegativeOneLiteral(node.right);
  }
  return (
    ">=" === node.operator &&
    isFindIndexCall(node.left) &&
    isZeroLiteral(node.right)
  );
};

const isFindIndexCall = (expression: TSESTree.Expression): boolean => {
  return (
    isCallExpression(expression) &&
    isMemberExpression(expression.callee) &&
    isIdentifier(expression.callee.property) &&
    "findIndex" === expression.callee.property.name
  );
};

// --- prefer-get ---

export const shouldPreferGet = (node: TSESTree.LogicalExpression): boolean => {
  if ("&&" !== node.operator) {
    return false;
  }

  const members = extractAndChain(node);
  /* v8 ignore if -- defensive guard: && always produces 2+ members */
  if (2 > members.length) {
    return false;
  }

  // Only fire on progressive property-access chains like `a && a.b && a.b.c`.
  // Each member after the first must be a MemberExpression whose object matches the preceding member by textual key, forming a single chain.
  // This avoids false positives on `part.type && part.value` (two independent
  // properties of the same object) or `x > 1 && x < 10` (comparisons).
  const memberKey = (expression: TSESTree.Expression): string => {
    if (isIdentifier(expression)) {
      return expression.name;
    }
    if (isMemberExpression(expression) && isIdentifier(expression.property)) {
      return `${memberKey(expression.object)}.${expression.property.name}`;
    }
    return "";
  };

  const [firstMember] = members;
  /* v8 ignore next -- defensive guard: extractAndChain always returns 2+ members */
  if (!firstMember) {
    return false;
  }

  let previousKey = memberKey(firstMember);
  if ("" === previousKey) {
    return false;
  }

  for (let index = 1; index < members.length; index += 1) {
    const current = members[index];
    if (!current || !isMemberExpression(current)) {
      return false;
    }
    const objectKey = memberKey(current.object);
    if (objectKey !== previousKey) {
      return false;
    }
    previousKey = memberKey(current);
  }

  return true;
};

const extractAndChain = (
  node: TSESTree.LogicalExpression
): TSESTree.Expression[] => {
  const parts: TSESTree.Expression[] = [];

  const collect = (expression: TSESTree.Expression): void => {
    if (
      AST_NODE_TYPES.LogicalExpression === expression.type &&
      "&&" === expression.operator
    ) {
      collect(expression.left);
      collect(expression.right);
      return;
    }
    parts.push(expression);
  };

  collect(node);
  return parts;
};

// --- prefer-map / prefer-filter (forEach + push patterns) ---

const getForEachIteratee = (
  node: TSESTree.CallExpression
): null | TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression => {
  if (!isMemberCallOnNamed(node, "forEach")) {
    return null;
  }
  const iteratee = node.arguments.at(0);
  if (isNil(iteratee)) {
    return null;
  }
  if (!isArrowFunctionExpression(iteratee) && !isFunctionExpression(iteratee)) {
    return null;
  }
  return iteratee;
};

export const shouldPreferMapPattern = (
  node: TSESTree.CallExpression
): boolean => {
  const iteratee = getForEachIteratee(node);
  if (null === iteratee) {
    return false;
  }

  const { body } = iteratee;
  if (!isBlockStatement(body) || 1 !== body.body.length) {
    return false;
  }

  const statement = body.body.at(0);
  if (isNil(statement) || !isExpressionStatement(statement)) {
    return false;
  }

  const call = statement.expression;
  if (!isCallExpression(call)) {
    return false;
  }

  return (
    isMemberExpression(call.callee) &&
    isIdentifier(call.callee.property) &&
    "push" === call.callee.property.name
  );
};

export const shouldPreferFilterPattern = (
  node: TSESTree.CallExpression
): boolean => {
  const iteratee = getForEachIteratee(node);
  if (null === iteratee) {
    return false;
  }

  const { body } = iteratee;
  if (!isBlockStatement(body) || 1 !== body.body.length) {
    return false;
  }

  const statement = body.body.at(0);
  if (statement?.type !== AST_NODE_TYPES.IfStatement) {
    return false;
  }

  const { consequent } = statement;
  if (!isBlockStatement(consequent) || 1 !== consequent.body.length) {
    return false;
  }

  /* v8 ignore next -- length check guarantees at(0) returns a value */
  return isPushStatement(consequent.body.at(0) ?? null);
};

const isPushStatement = (statement: null | TSESTree.Statement): boolean => {
  /* v8 ignore if */
  if (
    isNil(statement) ||
    !isExpressionStatement(statement) ||
    !isCallExpression(statement.expression)
  ) {
    return false;
  }
  const { callee } = statement.expression;
  return (
    isMemberExpression(callee) &&
    isIdentifier(callee.property) &&
    "push" === callee.property.name
  );
};

// --- prefer-find: filter[0] (MemberExpression) or filter().shift() (CallExpression) ---

export const shouldPreferFindMember = (
  node: TSESTree.MemberExpression
): boolean => {
  if (!node.computed) {
    return false;
  }
  const { property } = node;
  if (!isLiteralZero(property)) {
    return false;
  }
  const { object } = node;
  return isCallExpression(object) && isMemberCallOnNamed(object, "filter");
};

const isLiteralZero = (expression: TSESTree.Node): boolean => {
  return AST_NODE_TYPES.Literal === expression.type && 0 === expression.value;
};

export const shouldPreferFindShift = (
  node: TSESTree.CallExpression
): boolean => {
  if (!isMemberCallOnNamed(node, "shift")) {
    return false;
  }

  const { callee } = node;
  /* v8 ignore if -- defensive guard: isMemberCallOnNamed ensures callee is a member */
  if (!isMemberExpression(callee)) {
    return false;
  }

  const innerCall = callee.object;
  return (
    isCallExpression(innerCall) && isMemberCallOnNamed(innerCall, "filter")
  );
};

// --- prefer-constant ---

const isLiteralValue = (node: TSESTree.Node): boolean => {
  if (AST_NODE_TYPES.Literal === node.type) {
    return true;
  }
  if (AST_NODE_TYPES.UnaryExpression === node.type) {
    return isLiteralValue(node.argument);
  }
  /* v8 ignore start -- TemplateLiteral check: right side only matters when left is true */
  return (
    AST_NODE_TYPES.TemplateLiteral === node.type &&
    0 === node.expressions.length
  );
  /* v8 ignore stop */
};

export const shouldPreferConstant = (node: FunctionLike): boolean => {
  // Only fire when the function is used as a callback argument,
  // not when it's a standalone declaration or immediately invoked.
  if (AST_NODE_TYPES.FunctionDeclaration === node.type) {
    return false;
  }
  const { parent } = node;
  if (!isCallExpression(parent) || parent.callee === node) {
    return false;
  }
  const returned = getReturnedValue(node);
  if (null !== returned) {
    return isLiteralValue(returned);
  }
  return false;
};

// --- prefer-noop ---

export const shouldPreferNoop = (node: FunctionLike): boolean => {
  if (AST_NODE_TYPES.BlockStatement !== node.body.type) {
    return false;
  }
  if (0 !== node.body.body.length) {
    return false;
  }
  // Only fire when the empty function is used as a callback argument,
  // not when it's a standalone declaration or immediately invoked.
  if (AST_NODE_TYPES.FunctionDeclaration === node.type) {
    return false;
  }
  const { parent } = node;
  // Fire when parent is a CallExpression and the function is an argument
  // (not the callee). This catches `.then(() => {})`, `.catch(() => {})`, etc.
  return isCallExpression(parent) && parent.callee !== node;
};

// --- prefer-immutable-method ---

const MUTATING_METHODS: Record<string, string> = {
  pull: "without",
  pullAll: "difference",
  pullAllBy: "differenceBy",
  pullAllWith: "differenceWith",
  pullAt: "filter",
  remove: "filter"
};

export const resolvePreferImmutable = (
  node: TSESTree.CallExpression
): { method: string; preferred: string } | null => {
  if (isIdentifier(node.callee)) {
    const preferred = Object.hasOwn(MUTATING_METHODS, node.callee.name)
      ? MUTATING_METHODS[node.callee.name]
      : null;
    if (!isNil(preferred)) {
      /* v8 ignore next -- defensive guard: bare identifier mutating calls are unusual */
      return { method: node.callee.name, preferred };
    }
  }

  if (isMemberExpression(node.callee) && isIdentifier(node.callee.property)) {
    const preferred = Object.hasOwn(MUTATING_METHODS, node.callee.property.name)
      ? MUTATING_METHODS[node.callee.property.name]
      : null;
    if (!isNil(preferred)) {
      return { method: node.callee.property.name, preferred };
    }
  }

  return null;
};

// --- prefer-reject ---

export const shouldPreferReject = (node: TSESTree.CallExpression): boolean => {
  if (!isMemberCallOnNamed(node, "filter")) {
    return false;
  }

  const iterateeIndex = isLodashMemberCall(node) ? 1 : 0;
  const iteratee = node.arguments.at(iterateeIndex);

  if (isNil(iteratee)) {
    return false;
  }

  if (!isArrowFunctionExpression(iteratee) && !isFunctionExpression(iteratee)) {
    return false;
  }

  const returned = getReturnedValue(iteratee);
  if (null === returned) {
    return false;
  }

  return (
    AST_NODE_TYPES.UnaryExpression === returned.type &&
    "!" === returned.operator &&
    // Exclude double negation (!!x) — that's preferCompact, not preferReject
    AST_NODE_TYPES.UnaryExpression !== returned.argument.type
  );
};

// --- prefer-over-quantifier ---

export const resolvePreferOverQuantifier = (
  node: TSESTree.CallExpression
): "overEvery" | "overSome" | null => {
  if (!isMemberCallOnNamed(node, "filter")) {
    return null;
  }

  const iterateeIndex = isLodashMemberCall(node) ? 1 : 0;
  const iteratee = node.arguments.at(iterateeIndex);

  if (isNil(iteratee)) {
    return null;
  }

  if (!isArrowFunctionExpression(iteratee) && !isFunctionExpression(iteratee)) {
    return null;
  }

  const returned = getReturnedValue(iteratee);
  if (null === returned) {
    return null;
  }

  if (AST_NODE_TYPES.LogicalExpression === returned.type) {
    if ("&&" === returned.operator) {
      return "overEvery";
    }
    if ("||" === returned.operator) {
      return "overSome";
    }
  }

  return null;
};

// --- prefer-flat-map ---

export const shouldPreferFlatMap = (node: TSESTree.CallExpression): boolean => {
  if (!isMemberCallOnNamed(node, "flatten")) {
    return false;
  }

  const { callee } = node;
  /* v8 ignore if -- defensive guard: isMemberCallOnNamed ensures callee is a member */
  if (!isMemberExpression(callee)) {
    return false;
  }

  const innerCall = callee.object;
  return isCallExpression(innerCall) && isMemberCallOnNamed(innerCall, "map");
};

// --- prefer-times ---

export const shouldPreferTimes = (node: TSESTree.CallExpression): boolean => {
  const { callee } = node;
  if (!isMemberExpression(callee)) {
    return false;
  }

  const fillCall = callee.object;
  if (!isCallExpression(fillCall) || !isMemberCallOnNamed(fillCall, "fill")) {
    return false;
  }

  const fillCallee = fillCall.callee;
  /* v8 ignore if -- defensive guard: fill method is always a member expression */
  if (!isMemberExpression(fillCallee)) {
    return false;
  }

  const arrayCall = fillCallee.object;
  /* v8 ignore if -- defensive guard: arrayCall is validated by fill check */
  if (!isCallExpression(arrayCall)) {
    return false;
  }

  /* v8 ignore if -- defensive guard: calling an array literal as a function is invalid JS */
  if (AST_NODE_TYPES.ArrayExpression === arrayCall.callee.type) {
    return false;
  }

  return isIdentifier(arrayCall.callee) && "Array" === arrayCall.callee.name;
};

// --- prefer-matches ---

export const shouldPreferMatches = (node: TSESTree.CallExpression): boolean => {
  if (!isMemberCallOnNamed(node, "filter")) {
    return false;
  }

  const iterateeIndex = isLodashMemberCall(node) ? 1 : 0;
  const iteratee = node.arguments.at(iterateeIndex);

  if (isNil(iteratee)) {
    return false;
  }

  if (!isArrowFunctionExpression(iteratee) && !isFunctionExpression(iteratee)) {
    return false;
  }

  const returned = getReturnedValue(iteratee);
  if (null === returned) {
    return false;
  }

  if (AST_NODE_TYPES.LogicalExpression !== returned.type) {
    return false;
  }

  if ("&&" !== returned.operator) {
    return false;
  }

  return isAllEqualityChecks(returned);
};

const isAllEqualityChecks = (node: TSESTree.LogicalExpression): boolean => {
  const isCheck = (expression: TSESTree.Expression): boolean => {
    if (AST_NODE_TYPES.LogicalExpression === expression.type) {
      return isAllEqualityChecks(expression);
    }
    return (
      AST_NODE_TYPES.BinaryExpression === expression.type &&
      ("===" === expression.operator || "!==" === expression.operator)
    );
  };

  return isCheck(node.left) && isCheck(node.right);
};

// --- prefer-invoke-map ---

export const shouldPreferInvokeMap = (
  node: TSESTree.CallExpression
): boolean => {
  if (!isMemberCallOnNamed(node, "map")) {
    return false;
  }

  const iteratee = getMapFunctionIteratee(node);
  if (null === iteratee) {
    return false;
  }

  const returned = getReturnedValue(iteratee);
  if (null === returned || !isCallExpression(returned)) {
    return false;
  }

  const { callee } = returned;
  if (!isMemberExpression(callee)) {
    return false;
  }

  const parameter = iteratee.params.at(0);
  return (
    !isNil(parameter) &&
    isIdentifier(parameter) &&
    isIdentifier(callee.object) &&
    callee.object.name === parameter.name
  );
};

const getMapFunctionIteratee = (
  node: TSESTree.CallExpression
): null | TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression => {
  const iteratee = node.arguments.at(0);
  if (
    isNil(iteratee) ||
    (!isArrowFunctionExpression(iteratee) && !isFunctionExpression(iteratee))
  ) {
    return null;
  }
  return iteratee;
};

// --- Helpers ---

function isMemberCallOnNamed(
  node: TSESTree.CallExpression,
  name: string
): boolean {
  return (
    isMemberExpression(node.callee) &&
    isIdentifier(node.callee.property) &&
    node.callee.property.name === name
  );
}

export const isLodashIdentifierCall = (
  node: TSESTree.CallExpression
): boolean => {
  return isIdentifier(node.callee) && isLodashFunction(node.callee.name);
};
