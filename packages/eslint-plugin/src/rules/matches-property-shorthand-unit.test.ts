import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  isArrayLiteral,
  isFunctionReturningEqualityToMember,
  isLodashMatchesPropertyCall
} from "./matches-property-shorthand.ts";

const mockNode = <T extends TSESTree.Node>(
  type: AST_NODE_TYPES | T["type"],
  properties: Partial<T> = {}
): T => {
  return { type, ...properties } as unknown as T;
};

const identifier = (name: string): TSESTree.Identifier => {
  return mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, { name });
};

const literal = (value: boolean | null | number | string): TSESTree.Literal => {
  return mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value });
};

const memberExpression = (
  object: TSESTree.Expression,
  property: TSESTree.Identifier | TSESTree.MemberExpression,
  isComputed = false
): TSESTree.MemberExpression => {
  return mockNode<TSESTree.MemberExpression>(AST_NODE_TYPES.MemberExpression, {
    computed: isComputed as false,
    object,
    property: property as unknown as TSESTree.Identifier
  });
};

const binaryExpression = (
  operator: "!==" | "==" | "===",
  left: TSESTree.Expression,
  right: TSESTree.Expression
): TSESTree.BinaryExpression => {
  return mockNode<TSESTree.BinaryExpression>(AST_NODE_TYPES.BinaryExpression, {
    left,
    operator,
    right
  });
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

const returnStatement = (
  argument: null | TSESTree.Expression
): TSESTree.ReturnStatement => {
  return mockNode<TSESTree.ReturnStatement>(AST_NODE_TYPES.ReturnStatement, {
    argument
  });
};

const blockStatement = (
  body: TSESTree.Statement[]
): TSESTree.BlockStatement => {
  return mockNode<TSESTree.BlockStatement>(AST_NODE_TYPES.BlockStatement, {
    body
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

describe("isLodashMatchesPropertyCall", () => {
  it("returns false for undefined iteratee", () => {
    expect(isLodashMatchesPropertyCall(undefined)).toBe(false);
  });

  it("returns false for non-call expression", () => {
    expect(isLodashMatchesPropertyCall(identifier("x"))).toBe(false);
  });

  it("returns false for call with non-member callee", () => {
    const callee = identifier("matchesProperty");
    const node = callExpression(callee, []);
    expect(isLodashMatchesPropertyCall(node)).toBe(false);
  });

  it("returns false for call with non-identifier object", () => {
    const object = memberExpression(identifier("foo"), identifier("bar"));
    const property = identifier("matchesProperty");
    const callee = memberExpression(object, property);
    const node = callExpression(callee, []);
    expect(isLodashMatchesPropertyCall(node)).toBe(false);
  });

  it("returns false for call with non-identifier property", () => {
    const property = memberExpression(identifier("foo"), identifier("bar"));
    const callee = memberExpression(identifier("_"), property);
    const node = callExpression(callee, []);
    expect(isLodashMatchesPropertyCall(node)).toBe(false);
  });

  it("returns true for _.matchesProperty call", () => {
    const callee = memberExpression(
      identifier("_"),
      identifier("matchesProperty")
    );
    const node = callExpression(callee, []);
    expect(isLodashMatchesPropertyCall(node)).toBe(true);
  });

  it("returns true for lodash.matchesProperty call", () => {
    const callee = memberExpression(
      identifier("lodash"),
      identifier("matchesProperty")
    );
    const node = callExpression(callee, []);
    expect(isLodashMatchesPropertyCall(node)).toBe(true);
  });

  it("returns false for non-matchesProperty method", () => {
    const callee = memberExpression(identifier("_"), identifier("matches"));
    const node = callExpression(callee, []);
    expect(isLodashMatchesPropertyCall(node)).toBe(false);
  });

  it("returns false for non-lodash object", () => {
    const callee = memberExpression(
      identifier("foo"),
      identifier("matchesProperty")
    );
    const node = callExpression(callee, []);
    expect(isLodashMatchesPropertyCall(node)).toBe(false);
  });
});

describe("isArrayLiteral", () => {
  it("returns false for undefined iteratee in isArrayLiteral", () => {
    expect(isArrayLiteral(undefined)).toBe(false);
  });

  it("returns true for array expression", () => {
    const node = mockNode<TSESTree.ArrayExpression>(
      AST_NODE_TYPES.ArrayExpression,
      {
        elements: [literal("key"), literal(3)]
      }
    );
    expect(isArrayLiteral(node)).toBe(true);
  });

  it("returns false for non-array expression", () => {
    expect(isArrayLiteral(identifier("x"))).toBe(false);
  });
});

describe("isFunctionReturningEqualityToMember", () => {
  it("returns false for undefined iteratee in isFunctionReturningEqualityToMember", () => {
    expect(
      isFunctionReturningEqualityToMember(undefined, 3, false, false)
    ).toBe(false);
  });

  it("returns false for non-function iteratee", () => {
    expect(
      isFunctionReturningEqualityToMember(identifier("x"), 3, false, false)
    ).toBe(false);
  });

  it("returns false for function with no params", () => {
    const node = arrowFunction([], identifier("x"));
    expect(isFunctionReturningEqualityToMember(node, 3, false, false)).toBe(
      false
    );
  });

  it("returns false for function with non-identifier first param", () => {
    const rest = mockNode<TSESTree.RestElement>(AST_NODE_TYPES.RestElement, {
      argument: identifier("rest")
    });
    const node = arrowFunction([rest], identifier("x"));
    expect(isFunctionReturningEqualityToMember(node, 3, false, false)).toBe(
      false
    );
  });

  it("returns true for arrow function returning equality to member", () => {
    const left = memberExpression(identifier("x"), identifier("id"));
    const eq = binaryExpression("===", left, literal(3));
    const node = arrowFunction([identifier("x")], eq);
    expect(isFunctionReturningEqualityToMember(node, 3, false, false)).toBe(
      true
    );
  });

  it("returns true for FunctionExpression returning equality to member", () => {
    const left = memberExpression(identifier("x"), identifier("id"));
    const eq = binaryExpression("===", left, literal(3));
    const returnValue = returnStatement(eq);
    const block = blockStatement([returnValue]);
    const node = functionExpression([identifier("x")], block);
    expect(isFunctionReturningEqualityToMember(node, 3, false, false)).toBe(
      true
    );
  });

  it("returns false for function returning non-equality", () => {
    const node = arrowFunction([identifier("x")], identifier("y"));
    expect(isFunctionReturningEqualityToMember(node, 3, false, false)).toBe(
      false
    );
  });

  it("returns false with onlyLiterals for variable comparison", () => {
    const left = memberExpression(identifier("x"), identifier("id"));
    const right = identifier("currentId");
    const eq = binaryExpression("===", left, right);
    const node = arrowFunction([identifier("x")], eq);
    expect(isFunctionReturningEqualityToMember(node, 3, false, true)).toBe(
      false
    );
  });

  it("returns true with onlyLiterals for literal comparison", () => {
    const left = memberExpression(identifier("x"), identifier("id"));
    const eq = binaryExpression("===", left, literal(3));
    const node = arrowFunction([identifier("x")], eq);
    expect(isFunctionReturningEqualityToMember(node, 3, false, true)).toBe(
      true
    );
  });
});
