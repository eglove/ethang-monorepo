import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";

import {
  isCallExpression,
  isIdentifier,
  isMemberExpression
} from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashGroupBy";

type Options = [];

// Detect `arr.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {})`
// → `groupBy(arr, 'category')`
export const detectGroupByPattern = (
  node: TSESTree.Node
): { arr: TSESTree.Node; key: string } | null => {
  if (!isCallExpression(node)) {
    return null;
  }
  const call = node as TSESTree.CallExpression;

  // Must be a .reduce() call
  if (!isMemberExpression(call.callee)) {
    return null;
  }
  if (!isIdentifier(call.callee.property)) {
    return null;
  }
  if ("reduce" !== call.callee.property.name) {
    return null;
  }

  // Must have 2 arguments: callback and initial value (empty object)
  if (call.arguments.length < 2) {
    return null;
  }

  // Initial value must be empty object {}
  const initialValue = call.arguments[1];
  if (AST_NODE_TYPES.ObjectExpression !== initialValue.type) {
    return null;
  }
  const obj = initialValue as TSESTree.ObjectExpression;
  if (obj.properties.length !== 0) {
    return null;
  }

  // Callback must be an arrow function or function expression with 2 params
  const callback = call.arguments[0];
  if (
    AST_NODE_TYPES.ArrowFunctionExpression !== callback.type &&
    AST_NODE_TYPES.FunctionExpression !== callback.type
  ) {
    return null;
  }

  const fn = callback as TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;
  if (fn.params.length < 2) {
    return null;
  }

  const accParam = fn.params[0];
  const itemParam = fn.params[1];
  if (!isIdentifier(accParam) || !isIdentifier(itemParam)) {
    return null;
  }

  // Body must be a block with at least 2 statements: assignment and return
  if (AST_NODE_TYPES.BlockStatement !== fn.body.type) {
    return null;
  }
  const block = fn.body as TSESTree.BlockStatement;
  if (block.body.length < 2) {
    return null;
  }

  // Check for return acc; at the end
  const lastStmt = block.body[block.body.length - 1];
  if (AST_NODE_TYPES.ReturnStatement !== lastStmt.type) {
    return null;
  }
  const ret = lastStmt as TSESTree.ReturnStatement;
  if (!ret.argument || !isIdentifier(ret.argument)) {
    return null;
  }
  if (ret.argument.name !== accParam.name) {
    return null;
  }

  // Check for (acc[item.key] ||= []).push(item); pattern
  const firstStmt = block.body[0];
  if (AST_NODE_TYPES.ExpressionStatement !== firstStmt.type) {
    return null;
  }
  const exprStmt = firstStmt as TSESTree.ExpressionStatement;
  if (AST_NODE_TYPES.CallExpression !== exprStmt.expression.type) {
    return null;
  }
  const pushCall = exprStmt.expression as TSESTree.CallExpression;

  // Must be .push(item)
  if (!isMemberExpression(pushCall.callee)) {
    return null;
  }
  if (!isIdentifier(pushCall.callee.property)) {
    return null;
  }
  if ("push" !== pushCall.callee.property.name) {
    return null;
  }
  if (pushCall.arguments.length !== 1) {
    return null;
  }
  if (!isIdentifier(pushCall.arguments[0])) {
    return null;
  }
  if (pushCall.arguments[0].name !== itemParam.name) {
    return null;
  }

  // The callee object must be (acc[item.key] ||= [])
  const calleeObj = pushCall.callee.object;
  if (AST_NODE_TYPES.AssignmentExpression !== calleeObj.type) {
    return null;
  }
  const assign = calleeObj as TSESTree.AssignmentExpression;
  if ("||=" !== assign.operator) {
    return null;
  }

  // Right side must be []
  if (AST_NODE_TYPES.ArrayExpression !== assign.right.type) {
    return null;
  }
  const arrExpr = assign.right as TSESTree.ArrayExpression;
  if (arrExpr.elements.length !== 0) {
    return null;
  }

  // Left side must be acc[item.key]
  if (!isMemberExpression(assign.left)) {
    return null;
  }
  const member = assign.left as TSESTree.MemberExpression;
  if (!member.computed) {
    return null;
  }
  if (!isIdentifier(member.object)) {
    return null;
  }
  if (member.object.name !== accParam.name) {
    return null;
  }

  // Property must be item.key
  if (!isMemberExpression(member.property)) {
    return null;
  }
  const prop = member.property as TSESTree.MemberExpression;
  if (!isIdentifier(prop.object)) {
    return null;
  }
  if (prop.object.name !== itemParam.name) {
    return null;
  }
  if (!isIdentifier(prop.property)) {
    return null;
  }

  // Get the array being reduced
  let arr: TSESTree.Node;
  if (isMemberExpression(call.callee)) {
    arr = call.callee.object;
  } else {
    return null;
  }

  return { arr, key: prop.property.name };
};

export const preferLodashGroupByRule = createRule<Options, MessageIds>({
  create(context) {
    const listener: TSESTree.RuleListener = {
      CallExpression: (node) => {
        const result = detectGroupByPattern(node);
        if (!result) {
          return;
        }
        context.report({
          messageId: "preferLodashGroupBy",
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
        "Prefer `_.groupBy(arr, 'key')` over reduce-based groupBy patterns."
    },
    messages: {
      preferLodashGroupBy:
        "Prefer `_.groupBy(arr, 'key')` over reduce-based groupBy patterns. Lodash provides a cleaner, more readable alternative."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-group-by"
});
