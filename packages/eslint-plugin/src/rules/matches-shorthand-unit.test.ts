import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  getFirstParameterName,
  getValueReturnedInFirstStatement,
  isConjunctionOfEqualitiesToMemberOf,
  isEqualityToMemberOf,
  isFunctionReturningConjunction,
  isLodashMatchesCall,
  isMemberExpressionOf
} from "./matches-shorthand.ts";

// Helper: create a minimal mock node with the given type and properties.
const mockNode = <T extends TSESTree.Node>(
  type: AST_NODE_TYPES | T["type"],
  properties: Partial<T> = {}
): T => {
  return { type, ...properties } as unknown as T;
};

const PARAM = "x";

const identifier = (name: string): TSESTree.Identifier => {
  return mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, { name });
};

const memberExpression = (
  object: TSESTree.Expression,
  property: TSESTree.Identifier | TSESTree.Literal | TSESTree.MemberExpression,
  isComputed = false
): TSESTree.MemberExpression => {
  return mockNode<TSESTree.MemberExpression>(AST_NODE_TYPES.MemberExpression, {
    computed: isComputed as false,
    object,
    property: property as unknown as TSESTree.Identifier
  });
};

const literal = (value: boolean | number | string): TSESTree.Literal => {
  return mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value });
};

const binaryExpression = (
  operator: "!==" | "==" | "===",
  left: TSESTree.Expression | TSESTree.PrivateIdentifier,
  right: TSESTree.Expression | TSESTree.PrivateIdentifier
): TSESTree.BinaryExpression => {
  return mockNode<TSESTree.BinaryExpression>(AST_NODE_TYPES.BinaryExpression, {
    left,
    operator,
    right
  } as Partial<TSESTree.BinaryExpression>);
};

const privateIdentifier = (name: string): TSESTree.PrivateIdentifier => {
  return mockNode<TSESTree.PrivateIdentifier>(
    AST_NODE_TYPES.PrivateIdentifier,
    {
      name
    }
  );
};

const logicalExpression = (
  operator: "??" | "&&" | "||",
  left: TSESTree.Expression,
  right: TSESTree.Expression
): TSESTree.LogicalExpression => {
  return mockNode<TSESTree.LogicalExpression>(
    AST_NODE_TYPES.LogicalExpression,
    {
      left,
      operator,
      right
    }
  );
};

const returnStatement = (
  argument: null | TSESTree.Expression
): TSESTree.ReturnStatement => {
  return mockNode<TSESTree.ReturnStatement>(AST_NODE_TYPES.ReturnStatement, {
    argument
  });
};

const arrowFunction = (
  parameters: TSESTree.Parameter[],
  body: TSESTree.BlockStatement | TSESTree.Expression
): TSESTree.ArrowFunctionExpression => {
  return mockNode<TSESTree.ArrowFunctionExpression>(
    AST_NODE_TYPES.ArrowFunctionExpression,
    {
      body: body as TSESTree.Expression,
      params: parameters
    }
  );
};

const functionExpression = (
  parameters: TSESTree.Parameter[],
  body: TSESTree.BlockStatement
): TSESTree.FunctionExpression => {
  return mockNode<TSESTree.FunctionExpression>(
    AST_NODE_TYPES.FunctionExpression,
    {
      body,
      params: parameters
    }
  );
};

const callExpression = (
  callee: TSESTree.Expression,
  callArguments: TSESTree.Expression[]
): TSESTree.CallExpression => {
  return mockNode<TSESTree.CallExpression>(AST_NODE_TYPES.CallExpression, {
    arguments: callArguments,
    callee
  });
};

describe("getValueReturnedInFirstStatement", () => {
  it("returns body for arrow with expression body", () => {
    const body = identifier("x");
    const node = arrowFunction([], body);
    expect(getValueReturnedInFirstStatement(node)).toBe(body);
  });

  it("returns null for arrow with empty block body", () => {
    const block = mockNode<TSESTree.BlockStatement>(
      AST_NODE_TYPES.BlockStatement,
      {
        body: []
      }
    );
    const node = arrowFunction([], block);
    expect(getValueReturnedInFirstStatement(node)).toBeNull();
  });

  it("returns argument for arrow with return statement", () => {
    const argument = identifier("result");
    const returnValue = returnStatement(argument);
    const block = mockNode<TSESTree.BlockStatement>(
      AST_NODE_TYPES.BlockStatement,
      {
        body: [returnValue]
      }
    );
    const node = arrowFunction([], block);
    expect(getValueReturnedInFirstStatement(node)).toBe(argument);
  });

  it("returns null for arrow with non-return first statement", () => {
    const expression = mockNode<TSESTree.ExpressionStatement>(
      AST_NODE_TYPES.ExpressionStatement
    );
    const block = mockNode<TSESTree.BlockStatement>(
      AST_NODE_TYPES.BlockStatement,
      {
        body: [expression]
      }
    );
    const node = arrowFunction([], block);
    expect(getValueReturnedInFirstStatement(node)).toBeNull();
  });

  it("returns null for arrow with bare return", () => {
    const returnValue = returnStatement(null);
    const block = mockNode<TSESTree.BlockStatement>(
      AST_NODE_TYPES.BlockStatement,
      {
        body: [returnValue]
      }
    );
    const node = arrowFunction([], block);
    expect(getValueReturnedInFirstStatement(node)).toBeNull();
  });

  it("returns argument for FunctionExpression with return statement", () => {
    const argument = identifier("result");
    const returnValue = returnStatement(argument);
    const block = mockNode<TSESTree.BlockStatement>(
      AST_NODE_TYPES.BlockStatement,
      {
        body: [returnValue]
      }
    );
    const node = functionExpression([], block);
    expect(getValueReturnedInFirstStatement(node)).toBe(argument);
  });

  it("returns null for FunctionExpression with non-return first statement", () => {
    const expression = mockNode<TSESTree.ExpressionStatement>(
      AST_NODE_TYPES.ExpressionStatement
    );
    const block = mockNode<TSESTree.BlockStatement>(
      AST_NODE_TYPES.BlockStatement,
      {
        body: [expression]
      }
    );
    const node = functionExpression([], block);
    expect(getValueReturnedInFirstStatement(node)).toBeNull();
  });

  it("returns null for non-function expression", () => {
    const node = identifier("x");
    expect(getValueReturnedInFirstStatement(node)).toBeNull();
  });
});

describe("getFirstParameterName", () => {
  it("returns null for null node", () => {
    expect(getFirstParameterName(null)).toBeNull();
  });

  it("returns null for non-function node", () => {
    expect(getFirstParameterName(identifier("x"))).toBeNull();
  });

  it("returns null for function with no params", () => {
    const node = arrowFunction([], identifier("x"));
    expect(getFirstParameterName(node)).toBeNull();
  });

  it("returns null for function with non-identifier first param", () => {
    const parameter = mockNode<TSESTree.RestElement>(
      AST_NODE_TYPES.RestElement,
      {
        argument: identifier("rest")
      }
    );
    const node = arrowFunction([parameter], identifier("x"));
    expect(getFirstParameterName(node)).toBeNull();
  });

  it("returns name for function with identifier first param", () => {
    const node = arrowFunction([identifier("x")], identifier("x"));
    expect(getFirstParameterName(node)).toBe("x");
  });
});

describe("isMemberExpressionOf", () => {
  it("returns false for null node", () => {
    expect(isMemberExpressionOf(null, PARAM, 3, false)).toBe(false);
  });

  it("returns false for null parameterName", () => {
    expect(isMemberExpressionOf(identifier(PARAM), null, 3, false)).toBe(false);
  });

  it("returns false for non-member expression", () => {
    expect(isMemberExpressionOf(identifier(PARAM), PARAM, 3, false)).toBe(
      false
    );
  });

  it("returns false for computed member when isAllowComputed is false", () => {
    const member = memberExpression(identifier("x"), literal("key"), true);
    expect(isMemberExpressionOf(member, PARAM, 3, false)).toBe(false);
  });

  it("returns true for simple member expression matching parameter", () => {
    const member = memberExpression(identifier("x"), identifier("name"));
    expect(isMemberExpressionOf(member, PARAM, 3, false)).toBe(true);
  });

  it("returns true for computed member when isAllowComputed is true", () => {
    const member = memberExpression(identifier("x"), literal("key"), true);
    expect(isMemberExpressionOf(member, PARAM, 3, true)).toBe(true);
  });

  it("returns false for non-matching object", () => {
    const member = memberExpression(identifier("y"), identifier("name"));
    expect(isMemberExpressionOf(member, PARAM, 3, false)).toBe(false);
  });

  it("returns true for nested member expression within depth", () => {
    const inner = memberExpression(identifier("x"), identifier("user"));
    const outer = memberExpression(inner, identifier("name"));
    expect(isMemberExpressionOf(outer, PARAM, 3, false)).toBe(true);
  });

  it("returns false for nested member expression exceeding depth", () => {
    const a = memberExpression(identifier("x"), identifier("a"));
    const b = memberExpression(a, identifier("b"));
    const c = memberExpression(b, identifier("c"));
    expect(isMemberExpressionOf(c, PARAM, 1, false)).toBe(false);
  });
});

describe("isEqualityToMemberOf", () => {
  it("returns false for null expression", () => {
    expect(isEqualityToMemberOf(null, PARAM, 3, false, false)).toBe(false);
  });

  it("returns false for non-strict-equality expression", () => {
    const expression = binaryExpression("==", identifier("x"), literal("y"));
    expect(isEqualityToMemberOf(expression, PARAM, 3, false, false)).toBe(
      false
    );
  });

  it("returns false for null parameterName in isEqualityToMemberOf", () => {
    const expression = binaryExpression("===", identifier("x"), literal("y"));
    expect(isEqualityToMemberOf(expression, null, 3, false, false)).toBe(false);
  });

  it("returns false when both sides are members of parameter", () => {
    const left = memberExpression(identifier("x"), identifier("a"));
    const right = memberExpression(identifier("x"), identifier("b"));
    const expression = binaryExpression("===", left, right);
    expect(isEqualityToMemberOf(expression, PARAM, 3, false, false)).toBe(
      false
    );
  });

  it("returns false when neither side is a member of parameter", () => {
    const expression = binaryExpression("===", literal("a"), literal("b"));
    expect(isEqualityToMemberOf(expression, PARAM, 3, false, false)).toBe(
      false
    );
  });

  it("returns true when left side is member of parameter", () => {
    const left = memberExpression(identifier("x"), identifier("active"));
    const expression = binaryExpression("===", left, literal(true));
    expect(isEqualityToMemberOf(expression, PARAM, 3, false, false)).toBe(true);
  });

  it("returns true when right side is member of parameter", () => {
    const right = memberExpression(identifier("x"), identifier("active"));
    const expression = binaryExpression("===", literal(true), right);
    expect(isEqualityToMemberOf(expression, PARAM, 3, false, false)).toBe(true);
  });

  it("returns false with onlyLiterals when non-literal comparison", () => {
    const left = memberExpression(identifier("x"), identifier("active"));
    const right = identifier("y");
    const expression = binaryExpression("===", left, right);
    expect(isEqualityToMemberOf(expression, PARAM, 3, false, true)).toBe(false);
  });

  it("returns true with onlyLiterals when literal comparison", () => {
    const left = memberExpression(identifier("x"), identifier("active"));
    const expression = binaryExpression("===", left, literal(true));
    expect(isEqualityToMemberOf(expression, PARAM, 3, false, true)).toBe(true);
  });

  it("returns false when left side is a PrivateIdentifier", () => {
    const expression = binaryExpression(
      "===",
      privateIdentifier("foo"),
      literal(true)
    );
    expect(isEqualityToMemberOf(expression, PARAM, 3, false, false)).toBe(
      false
    );
  });

  it("returns false when right side is a PrivateIdentifier", () => {
    const expression = binaryExpression(
      "===",
      literal(true),
      privateIdentifier("foo")
    );
    expect(isEqualityToMemberOf(expression, PARAM, 3, false, false)).toBe(
      false
    );
  });
});

describe("isConjunctionOfEqualitiesToMemberOf", () => {
  it("returns false for null parameterName in isConjunctionOfEqualitiesToMemberOf", () => {
    expect(
      isConjunctionOfEqualitiesToMemberOf(null, null, 3, false, false)
    ).toBe(false);
  });

  it("returns true for single strict equality to member", () => {
    const left = memberExpression(identifier("x"), identifier("active"));
    const expression = binaryExpression("===", left, literal(true));
    expect(
      isConjunctionOfEqualitiesToMemberOf(expression, PARAM, 3, false, false)
    ).toBe(true);
  });

  it("returns false for non-equality non-conjunction expression", () => {
    expect(
      isConjunctionOfEqualitiesToMemberOf(
        identifier(PARAM),
        PARAM,
        3,
        false,
        false
      )
    ).toBe(false);
  });

  it("returns true for conjunction of two equalities", () => {
    const left1 = memberExpression(identifier("x"), identifier("active"));
    const eq1 = binaryExpression("===", left1, literal(true));
    const left2 = memberExpression(identifier("x"), identifier("role"));
    const eq2 = binaryExpression("===", left2, literal("admin"));
    const conjunction = logicalExpression("&&", eq1, eq2);
    expect(
      isConjunctionOfEqualitiesToMemberOf(conjunction, PARAM, 3, false, false)
    ).toBe(true);
  });

  it("returns false for conjunction with one non-equality side", () => {
    const left = memberExpression(identifier("x"), identifier("active"));
    const eq = binaryExpression("===", left, literal(true));
    const nonEq = identifier("y");
    const conjunction = logicalExpression("&&", eq, nonEq);
    expect(
      isConjunctionOfEqualitiesToMemberOf(conjunction, PARAM, 3, false, false)
    ).toBe(false);
  });

  it("returns false for conjunction with non-&& operator", () => {
    const left = memberExpression(identifier("x"), identifier("active"));
    const eq = binaryExpression("===", left, literal(true));
    const disjunction = logicalExpression("||", eq, eq);
    expect(
      isConjunctionOfEqualitiesToMemberOf(disjunction, PARAM, 3, false, false)
    ).toBe(false);
  });

  it("returns true for three-way conjunction", () => {
    const left1 = memberExpression(identifier("x"), identifier("a"));
    const eq1 = binaryExpression("===", left1, literal(1));
    const left2 = memberExpression(identifier("x"), identifier("b"));
    const eq2 = binaryExpression("===", left2, literal(2));
    const left3 = memberExpression(identifier("x"), identifier("c"));
    const eq3 = binaryExpression("===", left3, literal(3));
    const conj12 = logicalExpression("&&", eq1, eq2);
    const conj123 = logicalExpression("&&", conj12, eq3);
    expect(
      isConjunctionOfEqualitiesToMemberOf(conj123, PARAM, 3, false, false)
    ).toBe(true);
  });
});

describe("isFunctionReturningConjunction", () => {
  it("returns false for null iteratee", () => {
    expect(isFunctionReturningConjunction(null, 3, false, false)).toBe(false);
  });

  it("returns false for non-function iteratee", () => {
    expect(
      isFunctionReturningConjunction(identifier("x"), 3, false, false)
    ).toBe(false);
  });

  it("returns false for function with no params", () => {
    const node = arrowFunction([], identifier("x"));
    expect(isFunctionReturningConjunction(node, 3, false, false)).toBe(false);
  });

  it("returns false for function with non-identifier first param", () => {
    const rest = mockNode<TSESTree.RestElement>(AST_NODE_TYPES.RestElement, {
      argument: identifier("rest")
    });
    const node = arrowFunction([rest], identifier("x"));
    expect(isFunctionReturningConjunction(node, 3, false, false)).toBe(false);
  });

  it("returns true for arrow function returning equality to member", () => {
    const left = memberExpression(identifier("x"), identifier("active"));
    const eq = binaryExpression("===", left, literal(true));
    const node = arrowFunction([identifier("x")], eq);
    expect(isFunctionReturningConjunction(node, 3, false, false)).toBe(true);
  });

  it("returns true for FunctionExpression returning conjunction", () => {
    const left1 = memberExpression(identifier("x"), identifier("a"));
    const eq1 = binaryExpression("===", left1, literal(1));
    const left2 = memberExpression(identifier("x"), identifier("b"));
    const eq2 = binaryExpression("===", left2, literal(2));
    const conjunction = logicalExpression("&&", eq1, eq2);
    const returnValue = returnStatement(conjunction);
    const block = mockNode<TSESTree.BlockStatement>(
      AST_NODE_TYPES.BlockStatement,
      {
        body: [returnValue]
      }
    );
    const node = functionExpression([identifier("x")], block);
    expect(isFunctionReturningConjunction(node, 3, false, false)).toBe(true);
  });

  it("returns false for function returning non-equality non-conjunction", () => {
    const node = arrowFunction([identifier("x")], identifier("y"));
    expect(isFunctionReturningConjunction(node, 3, false, false)).toBe(false);
  });
});

describe("isLodashMatchesCall", () => {
  it("returns false for null iteratee", () => {
    expect(isLodashMatchesCall(null)).toBe(false);
  });

  it("returns false for non-call expression", () => {
    expect(isLodashMatchesCall(identifier("x"))).toBe(false);
  });

  it("returns false for call with non-member callee", () => {
    const callee = identifier("matches");
    const node = callExpression(callee, []);
    expect(isLodashMatchesCall(node)).toBe(false);
  });

  it("returns false for call with non-identifier object", () => {
    const object = memberExpression(identifier("foo"), identifier("bar"));
    const property = identifier("matches");
    const callee = memberExpression(object, property);
    const node = callExpression(callee, []);
    expect(isLodashMatchesCall(node)).toBe(false);
  });

  it("returns false for call with non-identifier property", () => {
    const property = memberExpression(identifier("foo"), identifier("bar"));
    const callee = memberExpression(identifier("_"), property);
    const node = callExpression(callee, []);
    expect(isLodashMatchesCall(node)).toBe(false);
  });

  it("returns true for _.matches call", () => {
    const callee = memberExpression(identifier("_"), identifier("matches"));
    const node = callExpression(callee, []);
    expect(isLodashMatchesCall(node)).toBe(true);
  });

  it("returns true for lodash.matches call", () => {
    const callee = memberExpression(
      identifier("lodash"),
      identifier("matches")
    );
    const node = callExpression(callee, []);
    expect(isLodashMatchesCall(node)).toBe(true);
  });

  it("returns false for non-matches method", () => {
    const callee = memberExpression(identifier("_"), identifier("filter"));
    const node = callExpression(callee, []);
    expect(isLodashMatchesCall(node)).toBe(false);
  });

  it("returns false for non-lodash object", () => {
    const callee = memberExpression(identifier("foo"), identifier("matches"));
    const node = callExpression(callee, []);
    expect(isLodashMatchesCall(node)).toBe(false);
  });
});
