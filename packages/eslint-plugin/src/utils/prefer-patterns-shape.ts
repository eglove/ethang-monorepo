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
    return AST_NODE_TYPES.ExpressionStatement === returned?.type
      ? returned.expression
      : null;
  }
  return iteratee.body;
};

// --- prefer-uniq ---
// Detects `[...new Set(arr)]` — called on a `NewExpression` (new Set(arr))
// from a dedicated NewExpression visitor in prefer-lodash.ts.
export const isValidUniqArgument = (
  argument: null | TSESTree.CallExpressionArgument | undefined
) => {
  return (
    !isNil(argument) &&
    (isIdentifier(argument) ||
      isMemberExpression(argument) ||
      isCallExpression(argument))
  );
};

export const shouldPreferUniq = (node: TSESTree.NewExpression) => {
  if (
    !isIdentifier(node.callee) ||
    "Set" !== node.callee.name ||
    1 !== node.arguments.length
  ) {
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

// Check if the inner access is a computed `[0]` literal index (unzip shape)
const isZeroLiteralIndex = (inner: TSESTree.MemberExpression) => {
  return (
    inner.computed &&
    AST_NODE_TYPES.Literal === inner.property.type &&
    0 === inner.property.value
  );
};

export const getZeroIndexedReceiver = (node: TSESTree.CallExpression) => {
  const { callee } = node;
  if (!isMemberExpression(callee) || !isMemberExpression(callee.object)) {
    return null;
  }
  const inner = callee.object;
  return isZeroLiteralIndex(inner) && isIdentifier(inner.object)
    ? { arrayName: inner.object.name, receiver: inner }
    : null;
};

export const isMapMethod = (node: TSESTree.CallExpression) => {
  return (
    isMemberExpression(node.callee) &&
    isIdentifier(node.callee.property) &&
    "map" === node.callee.property.name
  );
};

// Check if the node is a function expression (arrow or function expression)
const isFunctionExpressionLike = (
  node: null | TSESTree.Node | undefined
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression => {
  return (
    !isNil(node) &&
    (isArrowFunctionExpression(node) || isFunctionExpression(node))
  );
};

export const getTwoParameterArrow = (
  node: null | TSESTree.Node | undefined
) => {
  return !isFunctionExpressionLike(node) || 2 !== node.params.length
    ? null
    : node;
};

export const getOneParameterArrow = (
  node: null | TSESTree.Node | undefined
) => {
  return !isFunctionExpressionLike(node) || 1 !== node.params.length
    ? null
    : node;
};

// Check if the node is a computed member access on the given parameter
// (e.g. `r[i]` in an unzip inner map iteratee).
const isComputedMemberOfParameter = (
  node: TSESTree.Node,
  parameterName: string
): node is TSESTree.MemberExpression => {
  return (
    AST_NODE_TYPES.MemberExpression === node.type &&
    node.computed &&
    isIdentifier(node.object) &&
    node.object.name === parameterName
  );
};

export const isMatchingIndexedAccess = (
  node: TSESTree.Node,
  parameterName: string
) => {
  return (
    isComputedMemberOfParameter(node, parameterName) &&
    isIdentifier(node.property)
  );
};

export const getIndexedByParameter = (
  node: null | TSESTree.Node | undefined,
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

  return isIdentifier(member.property)
    ? { member, propertyName: member.property.name }
    : null;
};

export const getUnzipInnerArrayName = (body: TSESTree.CallExpression) => {
  const innerCallee = body.callee;
  return !isMemberExpression(innerCallee) || !isIdentifier(innerCallee.object)
    ? null
    : innerCallee.object.name;
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
  return isNil(indexed) || indexed.propertyName !== outerIndexName
    ? null
    : { arrayName, innerParameter };
};

export const getUnzipOuterIndex = (
  twoParameterIteratee:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
) => {
  const outerIndex = twoParameterIteratee.params.at(1);
  return isNil(outerIndex) || !isIdentifier(outerIndex)
    ? null
    : outerIndex.name;
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
  return (
    !isNil(innerArrayName) &&
    innerArrayName === zeroIndexed.arrayName &&
    !isNil(getUnzipIndexName(body, zeroIndexed.arrayName, outerIndexName))
  );
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
  return !isMemberExpression(node.callee) ||
    !isIdentifier(node.callee.property) ||
    "filter" !== node.callee.property.name
    ? null
    : node.callee.object;
};

export const getCallToPredicate = (node: null | TSESTree.Node | undefined) => {
  if (
    isNil(node) ||
    AST_NODE_TYPES.CallExpression !== node.type ||
    !isIdentifier(node.callee) ||
    1 !== node.arguments.length
  ) {
    return null;
  }
  const argument = node.arguments.at(0);
  return isNil(argument) || !isIdentifier(argument)
    ? null
    : { parameterName: argument.name, predName: node.callee.name };
};

export const isSingleParameterArrowBody = (
  node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
) => {
  if (
    AST_NODE_TYPES.BlockStatement === node.body.type ||
    1 !== node.params.length
  ) {
    return false;
  }
  const parameter = node.params.at(0);
  return !isNil(parameter) && isIdentifier(parameter);
};

export const getSingleParameterArrow = (
  node: null | TSESTree.Node | undefined
) => {
  if (isNil(node)) {
    return null;
  }
  if (!isArrowFunctionExpression(node) && !isFunctionExpression(node)) {
    return null;
  }
  return isSingleParameterArrowBody(node) ? node : null;
};

export const hasMatchingVariableDeclarator = (
  statement: TSESTree.VariableDeclaration,
  receiver: TSESTree.Expression,
  predName: string,
  parameterName: string
) => {
  return some(statement.declarations, (declaration) => {
    const { init } = declaration;
    return (
      !isNil(init) &&
      isCallExpression(init) &&
      isMatchingNegatedFilter(init, receiver, predName, parameterName)
    );
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
    return AST_NODE_TYPES.VariableDeclaration === statement.type
      ? hasMatchingVariableDeclarator(
          statement,
          receiver,
          predName,
          parameterName
        )
      : isExpressionStatement(statement) &&
          hasMatchingExpressionStatement(
            statement,
            receiver,
            predName,
            parameterName
          );
  });
};

// Check if `body` is `!callee(...)` — a unary negation wrapping a call
const isNegatedCall = (
  body: TSESTree.Node
): body is {
  readonly argument: TSESTree.CallExpression;
} & TSESTree.UnaryExpression => {
  return (
    AST_NODE_TYPES.UnaryExpression === body.type &&
    "!" === body.operator &&
    isCallExpression(body.argument)
  );
};

export const getNegatedPredicateArgument = (
  body: TSESTree.Node,
  predName: string
) => {
  if (
    !isNegatedCall(body) ||
    !isIdentifier(body.argument.callee) ||
    body.argument.callee.name !== predName ||
    1 !== body.argument.arguments.length
  ) {
    return null;
  }
  const argument = body.argument.arguments.at(0);
  return isNil(argument) || !isIdentifier(argument) ? null : argument;
};

export const isNegatedPredicateCall = (
  body: null | TSESTree.Node | undefined,
  predName: string,
  parameterName: string
) => {
  if (isNil(body)) {
    return false;
  }
  const argument = getNegatedPredicateArgument(body, predName);
  return !isNil(argument) && argument.name === parameterName;
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
    "filter" !== call.callee.property.name ||
    !isSameReceiverNode(call.callee.object, receiver)
  ) {
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

  if (
    isNil(parameter) ||
    !isIdentifier(parameter) ||
    parameter.name !== parameterName
  ) {
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
  return (
    isIdentifier(currentA) &&
    isIdentifier(currentB) &&
    currentA.name === currentB.name
  );
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

  if (isNil(parameter) || !isIdentifier(parameter)) {
    return null;
  }
  const body = getReturnedValue(singleParameterIteratee);
  const predicateCall = getCallToPredicate(body);
  return isNil(predicateCall) || predicateCall.parameterName !== parameter.name
    ? null
    : { parameter, predicateCall, receiver };
};

export const shouldPreferPartition = (
  node: TSESTree.CallExpression,
  program: TSESTree.Program
) => {
  const info = getPartitionIterateeInfo(node);
  return (
    !isNil(info) &&
    isProgramWithNegatedFilter(
      program,
      info.receiver,
      info.predicateCall.predName,
      info.predicateCall.parameterName
    )
  );
};

// --- prefer-count-by / prefer-key-by ---
// Detects `arr.reduce((acc, x) => { ... acc[expr] = (acc[expr] ?? 0) + 1; ... }, {})`
// for countBy, and the no-`+1` variant for keyBy.

// Check if the assignment target is a computed member on the accumulator
// (e.g. `acc[key] = ...` in a reduce callback).
const isComputedAccumulatorMember = (
  left: TSESTree.Node,
  accumulatorName: string
): left is TSESTree.MemberExpression => {
  return (
    AST_NODE_TYPES.MemberExpression === left.type &&
    left.computed &&
    isIdentifier(left.object) &&
    left.object.name === accumulatorName
  );
};

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
  return isComputedAccumulatorMember(assign.left, accumulatorName)
    ? assign
    : null;
};

export const isCountByAssignment = (assign: TSESTree.AssignmentExpression) => {
  return (
    AST_NODE_TYPES.BinaryExpression === assign.right.type &&
    "+" === assign.right.operator &&
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
    return !isNil(assign) && isCountByAssignment(assign);
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
    "reduce" !== node.callee.property.name ||
    2 !== node.arguments.length
  ) {
    return null;
  }
  const initial = node.arguments.at(1);
  return isNil(initial) ||
    AST_NODE_TYPES.ObjectExpression !== initial.type ||
    0 !== initial.properties.length
    ? null
    : node.arguments.at(0);
};

export const getBlockBodyTwoParameterCallback = (callback: TSESTree.Node) => {
  if (!isArrowFunctionExpression(callback) && !isFunctionExpression(callback)) {
    return null;
  }
  if (
    AST_NODE_TYPES.BlockStatement !== callback.body.type ||
    2 !== callback.params.length
  ) {
    return null;
  }
  const accumulator = callback.params.at(0);
  return isNil(accumulator) || !isIdentifier(accumulator)
    ? null
    : { accumulatorName: accumulator.name, body: callback.body };
};

export const getReduceCallback = (node: TSESTree.CallExpression) => {
  const first = getReduceCallInitial(node);
  return isNil(first) ? null : getBlockBodyTwoParameterCallback(first);
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
  if (
    AST_NODE_TYPES.BinaryExpression !== second.type ||
    !isIdentifier(second.left) ||
    second.left.name !== first.name
  ) {
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
  return AST_NODE_TYPES.BinaryExpression === second.type
    ? isChunkSliceOffsetBinary(first, second)
    : isIdentifier(second) && first.name !== second.name;
};

// Check if the callee is a `.slice()` member call on a plain identifier
const isSliceMemberCall = (node: TSESTree.CallExpression) => {
  return (
    isMemberExpression(node.callee) &&
    isIdentifier(node.callee.property) &&
    "slice" === node.callee.property.name &&
    isIdentifier(node.callee.object)
  );
};

export const isChunkSliceCall = (node: TSESTree.CallExpression) => {
  if (!isSliceMemberCall(node) || 2 !== node.arguments.length) {
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

  return (
    !isNil(first) &&
    !isNil(second) &&
    isChunkPushStatement(first) &&
    isChunkIncrementStatement(second)
  );
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
  if (!isBlockStatement(block) || !isChunkBlockBody(block)) {
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
  return (
    ("===" === node.operator || "!==" === node.operator) &&
    (isLengthEqualsZero(node) || isObjectKeysLengthEqualsZero(node))
  );
};

// Check the mirrored `0 === xs.length` form of an isEmpty comparison
const isZeroLengthOnRight = (node: TSESTree.BinaryExpression) => {
  const { left, right } = node;
  return (
    isLengthMemberAccess(right) &&
    isZeroLiteral(left) &&
    isValidIsEmptyReceiver(right.object)
  );
};

export const isLengthEqualsZero = (node: TSESTree.BinaryExpression) => {
  const { left, right } = node;
  return isLengthMemberAccess(left) && isZeroLiteral(right)
    ? isValidIsEmptyReceiver(left.object)
    : isZeroLengthOnRight(node);
};

export const getObjectKeysArgument = (innerCall: TSESTree.CallExpression) => {
  const { callee } = innerCall;
  if (
    !isMemberExpression(callee) ||
    !isIdentifier(callee.property) ||
    "keys" !== callee.property.name
  ) {
    return null;
  }
  return !isIdentifier(callee.object) || "Object" !== callee.object.name
    ? null
    : innerCall.arguments.at(0);
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

    return isLengthMemberAccess(right) && isZeroLiteral(left)
      ? right.object
      : null;
  }
  if (isObjectKeysLengthEqualsZero(node) && isLengthMemberAccess(node.left)) {
    const innerCall = node.left.object;

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
