// Shape-pattern detectors for the umbrella `prefer-lodash` rule.
//
// These detect native patterns that are not single method calls — e.g.
// `[...new Set(arr)]` (spread + new Set), `while (i < n) { out.push(arr.slice(i, i+2)); i += size; }`
// (chunk loop), `arr.filter(p); arr.filter(x => !p(x))` (partition), and
// `arr.reduce((acc, x) => { acc[k] = (acc[k] ?? 0) + 1; return acc; }, {})` (countBy).
//
// Each detector returns a boolean. The umbrella rule attaches a dedicated
// messageId (preferUniq, preferChunk, etc.) when the detector matches.

import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";
import some from "lodash/some.js";

import {
  isArrowFunctionExpression,
  isBlockStatement,
  isCallExpression,
  isExpressionStatement,
  isFunctionExpression,
  isIdentifier,
  isMemberExpression
} from "./type-guards.ts";

export const isZeroLiteral = (expression: TSESTree.Node) => {
  return AST_NODE_TYPES.Literal === expression.type && 0 === expression.value;
};

export const getReturnedValue = (
  iteratee:
    | null
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression
    // eslint-disable-next-line no-restricted-syntax
    | undefined
) => {
  if (isNil(iteratee)) {
    return null;
  }
  if (AST_NODE_TYPES.BlockStatement === iteratee.body.type) {
    const returned = iteratee.body.body.find((statement) => {
      return (
        AST_NODE_TYPES.ReturnStatement === statement.type ||
        AST_NODE_TYPES.ExpressionStatement === statement.type
      );
    });
    if (AST_NODE_TYPES.ReturnStatement === returned?.type) {
      return returned.argument;
    }
    if (AST_NODE_TYPES.ExpressionStatement === returned?.type) {
      return returned.expression;
    }
    return null;
  }
  return iteratee.body;
};

// --- prefer-uniq ---
// Detects `[...new Set(arr)]` — called on a `NewExpression` (new Set(arr))
// from a dedicated NewExpression visitor in prefer-lodash.ts.
export const isValidUniqArgument = (
  argument:
    | null
    | TSESTree.CallExpressionArgument
    // eslint-disable-next-line no-restricted-syntax
    | undefined
) => {
  if (isNil(argument)) {
    return false;
  }
  return (
    isIdentifier(argument) ||
    isMemberExpression(argument) ||
    isCallExpression(argument)
  );
};

export const shouldPreferUniq = (node: TSESTree.NewExpression) => {
  if (!isIdentifier(node.callee) || "Set" !== node.callee.name) {
    return false;
  }
  if (1 !== node.arguments.length) {
    return false;
  }
  const argument = node.arguments.at(0);
  if (isNil(argument) || !isValidUniqArgument(argument)) {
    return false;
  }
  const { parent } = node;
  return (
    AST_NODE_TYPES.SpreadElement === parent.type &&
    AST_NODE_TYPES.ArrayExpression === parent.parent.type
  );
};

// --- prefer-unzip / prefer-zip ---
// Detects `<arr>[0].map((_, i) => <arr>.map(r => r[i]))` (unzip) and the
// array-of-arrays variant (zip). Both share the same AST shape.

export const getZeroIndexedReceiver = (node: TSESTree.CallExpression) => {
  const { callee } = node;
  if (!isMemberExpression(callee) || !isMemberExpression(callee.object)) {
    return null;
  }
  const inner = callee.object;
  if (
    !inner.computed ||
    AST_NODE_TYPES.Literal !== inner.property.type ||
    0 !== inner.property.value
  ) {
    return null;
  }
  if (!isIdentifier(inner.object)) {
    return null;
  }
  return { arrayName: inner.object.name, receiver: inner };
};

export const isMapMethod = (node: TSESTree.CallExpression) => {
  return (
    isMemberExpression(node.callee) &&
    isIdentifier(node.callee.property) &&
    "map" === node.callee.property.name
  );
};

export const getTwoParameterArrow = (
  node:
    | null
    | TSESTree.Node
    // eslint-disable-next-line no-restricted-syntax
    | undefined
) => {
  if (
    isNil(node) ||
    (!isArrowFunctionExpression(node) && !isFunctionExpression(node)) ||
    2 !== node.params.length
  ) {
    return null;
  }
  return node;
};

export const getOneParameterArrow = (
  node:
    | null
    | TSESTree.Node
    // eslint-disable-next-line no-restricted-syntax
    | undefined
) => {
  if (
    isNil(node) ||
    (!isArrowFunctionExpression(node) && !isFunctionExpression(node)) ||
    1 !== node.params.length
  ) {
    return null;
  }
  return node;
};

export const isMatchingIndexedAccess = (
  node: TSESTree.Node,
  parameterName: string
) => {
  if (AST_NODE_TYPES.MemberExpression !== node.type) {
    return false;
  }
  if (!node.computed) {
    return false;
  }
  if (!isIdentifier(node.object)) {
    return false;
  }
  if (node.object.name !== parameterName) {
    return false;
  }
  return isIdentifier(node.property);
};

export const getIndexedByParameter = (
  node:
    | null
    | TSESTree.Node
    // eslint-disable-next-line no-restricted-syntax
    | undefined,
  parameterName: string
) => {
  if (
    isNil(node) ||
    AST_NODE_TYPES.MemberExpression !== node.type ||
    !isMatchingIndexedAccess(node, parameterName)
  ) {
    return null;
  }
  const member = node;
  /* v8 ignore next 3 -- isMatchingIndexedAccess guarantees an identifier property. */
  if (!isIdentifier(member.property)) {
    return null;
  }
  return { member, propertyName: member.property.name };
};

export const getUnzipInnerArrayName = (body: TSESTree.CallExpression) => {
  const innerCallee = body.callee;
  if (!isMemberExpression(innerCallee) || !isIdentifier(innerCallee.object)) {
    return null;
  }
  return innerCallee.object.name;
};

export const getUnzipIndexName = (
  body: null | TSESTree.CallExpression,
  arrayName: string,
  outerIndexName: string
) => {
  if (isNil(body)) {
    return null;
  }
  const innerIteratee = body.arguments.at(0);
  const oneParameterIteratee = getOneParameterArrow(innerIteratee);
  if (isNil(oneParameterIteratee)) {
    return null;
  }
  const innerParameter = oneParameterIteratee.params.at(0);
  if (isNil(innerParameter) || !isIdentifier(innerParameter)) {
    return null;
  }
  const indexed = getIndexedByParameter(
    getReturnedValue(oneParameterIteratee),
    innerParameter.name
  );
  if (isNil(indexed)) {
    return null;
  }
  if (indexed.propertyName !== outerIndexName) {
    return null;
  }
  return { arrayName, innerParameter };
};

export const getUnzipOuterIndex = (
  twoParameterIteratee:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
) => {
  const outerIndex = twoParameterIteratee.params.at(1);
  if (isNil(outerIndex) || !isIdentifier(outerIndex)) {
    return null;
  }
  return outerIndex.name;
};

export const isUnzipStyleOuter = (node: TSESTree.CallExpression) => {
  if (!isMapMethod(node)) {
    return false;
  }
  const zeroIndexed = getZeroIndexedReceiver(node);
  if (isNil(zeroIndexed)) {
    return false;
  }
  const iteratee = node.arguments.at(0);
  const twoParameterIteratee = getTwoParameterArrow(iteratee);
  if (isNil(twoParameterIteratee)) {
    return false;
  }
  const outerIndexName = getUnzipOuterIndex(twoParameterIteratee);
  if (isNil(outerIndexName)) {
    return false;
  }
  const body = getReturnedValue(twoParameterIteratee);
  if (isNil(body) || !isCallExpression(body) || !isMapMethod(body)) {
    return false;
  }
  const innerArrayName = getUnzipInnerArrayName(body);
  if (isNil(innerArrayName) || innerArrayName !== zeroIndexed.arrayName) {
    return false;
  }
  return !isNil(getUnzipIndexName(body, zeroIndexed.arrayName, outerIndexName));
};

export const shouldPreferUnzip = (node: TSESTree.CallExpression) => {
  return isUnzipStyleOuter(node);
};

export const shouldPreferZip = (node: TSESTree.CallExpression) => {
  return isUnzipStyleOuter(node);
};

// --- prefer-partition ---
// Detects `arr.filter(p); arr.filter(x => !p(x))` — fires on the predicate
// form when a sibling statement contains the negated form.

export const getFilterCallReceiver = (node: TSESTree.CallExpression) => {
  if (
    !isMemberExpression(node.callee) ||
    !isIdentifier(node.callee.property) ||
    "filter" !== node.callee.property.name
  ) {
    return null;
  }
  return node.callee.object;
};

export const getCallToPredicate = (
  node:
    | null
    | TSESTree.Node
    // eslint-disable-next-line no-restricted-syntax
    | undefined
) => {
  if (
    isNil(node) ||
    AST_NODE_TYPES.CallExpression !== node.type ||
    !isIdentifier(node.callee) ||
    1 !== node.arguments.length
  ) {
    return null;
  }
  const argument = node.arguments.at(0);
  if (isNil(argument) || !isIdentifier(argument)) {
    return null;
  }
  return { parameterName: argument.name, predName: node.callee.name };
};

export const isSingleParameterArrowBody = (
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
) => {
  if (AST_NODE_TYPES.BlockStatement === node.body.type) {
    return false;
  }
  if (1 !== node.params.length) {
    return false;
  }
  const parameter = node.params.at(0);
  return !isNil(parameter) && isIdentifier(parameter);
};

export const getSingleParameterArrow = (
  node:
    | null
    | TSESTree.Node
    // eslint-disable-next-line no-restricted-syntax
    | undefined
) => {
  if (isNil(node)) {
    return null;
  }
  if (!isArrowFunctionExpression(node) && !isFunctionExpression(node)) {
    return null;
  }
  if (!isSingleParameterArrowBody(node)) {
    return null;
  }
  return node;
};

export const hasMatchingVariableDeclarator = (
  statement: TSESTree.VariableDeclaration,
  receiver: TSESTree.Expression,
  predName: string,
  parameterName: string
) => {
  return some(statement.declarations, (declaration) => {
    const { init } = declaration;
    if (isNil(init) || !isCallExpression(init)) {
      return false;
    }
    return isMatchingNegatedFilter(init, receiver, predName, parameterName);
  });
};

export const hasMatchingExpressionStatement = (
  statement: TSESTree.ExpressionStatement,
  receiver: TSESTree.Expression,
  predName: string,
  parameterName: string
) => {
  return (
    isCallExpression(statement.expression) &&
    isMatchingNegatedFilter(
      statement.expression,
      receiver,
      predName,
      parameterName
    )
  );
};

export const isProgramWithNegatedFilter = (
  program: TSESTree.Program,
  receiver: TSESTree.Expression,
  predName: string,
  parameterName: string
) => {
  return some(program.body, (statement) => {
    if (AST_NODE_TYPES.VariableDeclaration === statement.type) {
      return hasMatchingVariableDeclarator(
        statement,
        receiver,
        predName,
        parameterName
      );
    }
    if (!isExpressionStatement(statement)) {
      return false;
    }
    return hasMatchingExpressionStatement(
      statement,
      receiver,
      predName,
      parameterName
    );
  });
};

export const getNegatedPredicateArgument = (
  body: TSESTree.Node,
  predName: string
) => {
  if (AST_NODE_TYPES.UnaryExpression !== body.type) {
    return null;
  }
  if ("!" !== body.operator) {
    return null;
  }
  if (!isCallExpression(body.argument)) {
    return null;
  }
  if (!isIdentifier(body.argument.callee)) {
    return null;
  }
  if (body.argument.callee.name !== predName) {
    return null;
  }
  if (1 !== body.argument.arguments.length) {
    return null;
  }
  const argument = body.argument.arguments.at(0);
  if (isNil(argument) || !isIdentifier(argument)) {
    return null;
  }
  return argument;
};

export const isNegatedPredicateCall = (
  body:
    | null
    | TSESTree.Node
    // eslint-disable-next-line no-restricted-syntax
    | undefined,
  predName: string,
  parameterName: string
) => {
  if (isNil(body)) {
    return false;
  }
  const argument = getNegatedPredicateArgument(body, predName);
  if (isNil(argument)) {
    return false;
  }
  return argument.name === parameterName;
};

export const isMatchingNegatedFilter = (
  call: TSESTree.CallExpression,
  receiver: TSESTree.Expression,
  predName: string,
  parameterName: string
) => {
  if (
    !isMemberExpression(call.callee) ||
    !isIdentifier(call.callee.property) ||
    "filter" !== call.callee.property.name
  ) {
    return false;
  }
  if (!isSameReceiverNode(call.callee.object, receiver)) {
    return false;
  }
  const iteratee = call.arguments.at(0);
  if (isNil(iteratee)) {
    return false;
  }
  const singleParameterIteratee = getSingleParameterArrow(iteratee);
  if (isNil(singleParameterIteratee)) {
    return false;
  }
  const parameter = singleParameterIteratee.params.at(0);
  /* v8 ignore next 3 -- getSingleParameterArrow guarantees one identifier parameter. */
  if (isNil(parameter) || !isIdentifier(parameter)) {
    return false;
  }
  if (parameter.name !== parameterName) {
    return false;
  }
  const body = getReturnedValue(singleParameterIteratee);
  return isNegatedPredicateCall(body, predName, parameter.name);
};

export const isSameReceiverNode = (a: TSESTree.Node, b: TSESTree.Node) => {
  let currentA = a;
  let currentB = b;
  while (isMemberExpression(currentA) && isMemberExpression(currentB)) {
    currentA = currentA.object;
    currentB = currentB.object;
  }
  if (isIdentifier(currentA) && isIdentifier(currentB)) {
    return currentA.name === currentB.name;
  }
  return false;
};

export const getPartitionIterateeInfo = (node: TSESTree.CallExpression) => {
  const receiver = getFilterCallReceiver(node);
  if (isNil(receiver)) {
    return null;
  }
  if (!isIdentifier(receiver) && !isMemberExpression(receiver)) {
    return null;
  }
  const iteratee = node.arguments.at(0);
  if (isNil(iteratee)) {
    return null;
  }
  const singleParameterIteratee = getSingleParameterArrow(iteratee);
  if (isNil(singleParameterIteratee)) {
    return null;
  }
  const parameter = singleParameterIteratee.params.at(0);
  /* v8 ignore next 3 -- getSingleParameterArrow guarantees one identifier parameter. */
  if (isNil(parameter) || !isIdentifier(parameter)) {
    return null;
  }
  const body = getReturnedValue(singleParameterIteratee);
  const predicateCall = getCallToPredicate(body);
  if (isNil(predicateCall)) {
    return null;
  }
  if (predicateCall.parameterName !== parameter.name) {
    return null;
  }
  return { parameter, predicateCall, receiver };
};

export const shouldPreferPartition = (
  node: TSESTree.CallExpression,
  program: TSESTree.Program
) => {
  const info = getPartitionIterateeInfo(node);
  if (isNil(info)) {
    return false;
  }
  return isProgramWithNegatedFilter(
    program,
    info.receiver,
    info.predicateCall.predName,
    info.predicateCall.parameterName
  );
};

// --- prefer-count-by / prefer-key-by ---
// Detects `arr.reduce((acc, x) => { ... acc[expr] = (acc[expr] ?? 0) + 1; ... }, {})`
// for countBy, and the no-`+1` variant for keyBy.

export const getAccumulatorAssignment = (
  statement: TSESTree.Statement,
  accumulatorName: string
) => {
  if (
    !isExpressionStatement(statement) ||
    AST_NODE_TYPES.AssignmentExpression !== statement.expression.type
  ) {
    return null;
  }
  const assign = statement.expression;
  if (
    AST_NODE_TYPES.MemberExpression !== assign.left.type ||
    !isIdentifier(assign.left.object) ||
    assign.left.object.name !== accumulatorName ||
    !assign.left.computed
  ) {
    return null;
  }
  return assign;
};

export const isCountByAssignment = (assign: TSESTree.AssignmentExpression) => {
  if (AST_NODE_TYPES.BinaryExpression !== assign.right.type) {
    return false;
  }
  if ("+" !== assign.right.operator) {
    return false;
  }
  return (
    AST_NODE_TYPES.Literal === assign.right.right.type &&
    1 === assign.right.right.value
  );
};

export const isCountByShape = (
  body: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  return some(body.body, (statement) => {
    const assign = getAccumulatorAssignment(statement, accumulatorName);
    if (isNil(assign)) {
      return false;
    }
    return isCountByAssignment(assign);
  });
};

export const isKeyByShape = (
  body: TSESTree.BlockStatement,
  accumulatorName: string
) => {
  return some(body.body, (statement) => {
    const assign = getAccumulatorAssignment(statement, accumulatorName);
    if (isNil(assign)) {
      return false;
    }
    // Exclude the countBy pattern (`acc[k] = (acc[k] ?? 0) + 1`) so the
    // keyBy detector doesn't also fire on countBy reduce callbacks.
    return !isCountByAssignment(assign);
  });
};

export const getReduceCallInitial = (node: TSESTree.CallExpression) => {
  if (
    !isMemberExpression(node.callee) ||
    !isIdentifier(node.callee.property) ||
    "reduce" !== node.callee.property.name
  ) {
    return null;
  }
  if (2 !== node.arguments.length) {
    return null;
  }
  const initial = node.arguments.at(1);
  if (
    isNil(initial) ||
    AST_NODE_TYPES.ObjectExpression !== initial.type ||
    0 !== initial.properties.length
  ) {
    return null;
  }
  return node.arguments.at(0);
};

export const getBlockBodyTwoParameterCallback = (callback: TSESTree.Node) => {
  if (!isArrowFunctionExpression(callback) && !isFunctionExpression(callback)) {
    return null;
  }
  if (AST_NODE_TYPES.BlockStatement !== callback.body.type) {
    return null;
  }
  if (2 !== callback.params.length) {
    return null;
  }
  const accumulator = callback.params.at(0);
  if (isNil(accumulator) || !isIdentifier(accumulator)) {
    return null;
  }
  return { accumulatorName: accumulator.name, body: callback.body };
};

export const getReduceCallback = (node: TSESTree.CallExpression) => {
  const first = getReduceCallInitial(node);
  if (isNil(first)) {
    return null;
  }
  return getBlockBodyTwoParameterCallback(first);
};

export const isCountOrKeyByPattern = (
  node: TSESTree.CallExpression,
  isCount: boolean
) => {
  const reduce = getReduceCallback(node);
  if (isNil(reduce)) {
    return false;
  }
  return isCount
    ? isCountByShape(reduce.body, reduce.accumulatorName)
    : isKeyByShape(reduce.body, reduce.accumulatorName);
};

export const shouldPreferCountBy = (node: TSESTree.CallExpression) => {
  return isCountOrKeyByPattern(node, true);
};

export const shouldPreferKeyBy = (node: TSESTree.CallExpression) => {
  return isCountOrKeyByPattern(node, false);
};

// --- prefer-chunk ---
// Detects the canonical chunk while-loop pattern. The detector is called
// on the inner `arr.slice(i, i + size)` call and walks up to verify the
// surrounding while/for block.

export const isChunkSliceOffsetBinary = (
  first: TSESTree.Identifier,
  second: TSESTree.Node
) => {
  if (AST_NODE_TYPES.BinaryExpression !== second.type) {
    return false;
  }
  if (!isIdentifier(second.left) || second.left.name !== first.name) {
    return false;
  }
  // Accept `i + size` (Identifier) or `i + N` (Literal number) as the offset.
  return (
    isIdentifier(second.right) || AST_NODE_TYPES.Literal === second.right.type
  );
};

export const isChunkSliceFirstArgument = (
  first: TSESTree.Node,
  second: TSESTree.Node
) => {
  if (!isIdentifier(first)) {
    return false;
  }
  if (AST_NODE_TYPES.BinaryExpression === second.type) {
    return isChunkSliceOffsetBinary(first, second);
  }
  return isIdentifier(second) && first.name !== second.name;
};

export const isChunkSliceCall = (node: TSESTree.CallExpression) => {
  if (
    !isMemberExpression(node.callee) ||
    !isIdentifier(node.callee.property) ||
    "slice" !== node.callee.property.name ||
    !isIdentifier(node.callee.object)
  ) {
    return false;
  }
  if (2 !== node.arguments.length) {
    return false;
  }
  const first = node.arguments.at(0);
  const second = node.arguments.at(1);
  return (
    !isNil(first) && !isNil(second) && isChunkSliceFirstArgument(first, second)
  );
};

export const isChunkPushStatement = (statement: TSESTree.Statement) => {
  if (
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

export const isChunkIncrementStatement = (statement: TSESTree.Statement) => {
  if (!isExpressionStatement(statement)) {
    return false;
  }
  const { expression } = statement;
  return (
    AST_NODE_TYPES.AssignmentExpression === expression.type &&
    "+=" === expression.operator &&
    isIdentifier(expression.left)
  );
};

export const isChunkBlockBody = (block: TSESTree.BlockStatement) => {
  if (2 !== block.body.length) {
    return false;
  }
  const first = block.body.at(0);
  const second = block.body.at(1);
  /* v8 ignore next 3 -- exact two-element length above makes both indices present. */
  if (isNil(first) || isNil(second)) {
    return false;
  }
  return isChunkPushStatement(first) && isChunkIncrementStatement(second);
};

export const shouldPreferChunk = (node: TSESTree.CallExpression) => {
  if (!isChunkSliceCall(node)) {
    return false;
  }
  // Walk up: arr.slice(i, i+2) is the argument to out.push(...)
  // → CallExpression (push) → ExpressionStatement → BlockStatement → WhileStatement
  const pushCall = node.parent;
  if (!isCallExpression(pushCall)) {
    return false;
  }
  const pushStatement = pushCall.parent;
  if (!isExpressionStatement(pushStatement)) {
    return false;
  }
  const block = pushStatement.parent;
  if (!isBlockStatement(block)) {
    return false;
  }
  if (!isChunkBlockBody(block)) {
    return false;
  }
  const loop = block.parent;
  return (
    AST_NODE_TYPES.WhileStatement === loop.type ||
    AST_NODE_TYPES.ForStatement === loop.type
  );
};

// --- prefer-is-empty (BinaryExpression) ---

export const shouldPreferIsEmpty = (node: TSESTree.BinaryExpression) => {
  if ("===" !== node.operator && "!==" !== node.operator) {
    return false;
  }
  return isLengthEqualsZero(node) || isObjectKeysLengthEqualsZero(node);
};

export const isLengthEqualsZero = (node: TSESTree.BinaryExpression) => {
  const { left, right } = node;
  if (isLengthMemberAccess(left) && isZeroLiteral(right)) {
    return isValidIsEmptyReceiver(left.object);
  }
  if (isLengthMemberAccess(right) && isZeroLiteral(left)) {
    return isValidIsEmptyReceiver(right.object);
  }
  return false;
};

export const getObjectKeysArgument = (innerCall: TSESTree.CallExpression) => {
  const { callee } = innerCall;
  if (!isMemberExpression(callee) || !isIdentifier(callee.property)) {
    return null;
  }
  if ("keys" !== callee.property.name) {
    return null;
  }
  if (!isIdentifier(callee.object) || "Object" !== callee.object.name) {
    return null;
  }
  return innerCall.arguments.at(0);
};

export const isObjectKeysLengthEqualsZero = (
  node: TSESTree.BinaryExpression
) => {
  const { left, right } = node;
  if (!isZeroLiteral(right) || !isLengthMemberAccess(left)) {
    return false;
  }
  const innerCall = left.object;
  if (!isCallExpression(innerCall)) {
    return false;
  }
  const argument = getObjectKeysArgument(innerCall);
  return !isNil(argument) && isValidIsEmptyReceiver(argument);
};

export const getIsEmptyReceiver = (node: TSESTree.BinaryExpression) => {
  if (isLengthEqualsZero(node)) {
    const { left, right } = node;
    if (isLengthMemberAccess(left) && isZeroLiteral(right)) {
      return left.object;
    }
    /* v8 ignore next 3 -- isLengthEqualsZero guarantees this reverse orientation here. */
    if (isLengthMemberAccess(right) && isZeroLiteral(left)) {
      return right.object;
    }
    /* v8 ignore next -- isLengthEqualsZero guarantees one of the two orientations. */
    return null;
  }
  if (isObjectKeysLengthEqualsZero(node) && isLengthMemberAccess(node.left)) {
    const innerCall = node.left.object;
    /* v8 ignore next 3 -- isObjectKeysLengthEqualsZero guarantees a call receiver. */
    if (isCallExpression(innerCall)) {
      return getObjectKeysArgument(innerCall);
    }
  }
  return null;
};

export const isLengthMemberAccess = (
  node: TSESTree.Node
): node is TSESTree.MemberExpression => {
  return (
    AST_NODE_TYPES.MemberExpression === node.type &&
    !node.computed &&
    isIdentifier(node.property) &&
    "length" === node.property.name
  );
};

export const isValidIsEmptyReceiver = (node: TSESTree.Node) => {
  if (!isIdentifier(node) && !isMemberExpression(node)) {
    return false;
  }
  // Reject the global `undefined` identifier (null/undefined literals
  // can't reach here because they're not Identifier or MemberExpression).
  if (isIdentifier(node) && "undefined" === node.name) {
    return false;
  }
  return true;
};
