import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  getCaller,
  getEndOfChain,
  getMethodName,
  isCallToMethod,
  isChainable,
  isChainBreaker,
  isExplicitChainStart,
  isMethodCall,
  isObjectOfMethodCall
} from "./chain.ts";

const mockNode = <T extends TSESTree.Node>(
  type: T["type"],
  properties: Partial<T> = {}
) => {
  return { type, ...properties } as unknown as T;
};

const mockIdentifier = (name: string) => {
  return mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, { name });
};

const mockCallExpression = (
  callee: TSESTree.Expression,
  parameters: TSESTree.Expression[] = []
) => {
  return mockNode<TSESTree.CallExpression>(AST_NODE_TYPES.CallExpression, {
    arguments: parameters,
    callee
  });
};

const mockMemberExpression = (
  object: TSESTree.Expression,
  property: TSESTree.Expression
) => {
  return mockNode<TSESTree.MemberExpression>(AST_NODE_TYPES.MemberExpression, {
    computed: false as const,
    object,
    property: property as unknown as TSESTree.Identifier
  });
};

const mockLiteral = (value: string) => {
  return mockNode<TSESTree.StringLiteral>(AST_NODE_TYPES.Literal, {
    value
  });
};

const chainMethodName = "chain";
const mapMethodName = "map";
const nullMethodNameTestDescription = "returns false when method name is null";

const mockComputedMember = () => {
  return {
    computed: false,
    object: mockIdentifier("chain"),
    parent: null,
    property: {
      expressions: [],
      parent: null,
      quasis: [],
      type: AST_NODE_TYPES.TemplateLiteral
    },
    type: AST_NODE_TYPES.MemberExpression
  } as unknown as TSESTree.MemberExpression;
};

describe("chain utility tests", () => {
  describe("getMethodName", () => {
    it("returns property name for member expression with identifier property", () => {
      const call = mockCallExpression(
        mockMemberExpression(mockIdentifier("obj"), mockIdentifier("map"))
      );
      expect(getMethodName(call)).toBe("map");
    });

    it("returns property value for member expression with literal property", () => {
      const call = mockCallExpression(
        mockMemberExpression(mockIdentifier("obj"), mockLiteral("map"))
      );
      expect(getMethodName(call)).toBe("map");
    });

    it("returns identifier name for identifier callee", () => {
      const call = mockCallExpression(mockIdentifier("map"));
      expect(getMethodName(call)).toBe("map");
    });

    it("returns null for unknown callee type", () => {
      const call = mockCallExpression(
        mockNode<TSESTree.Expression>(AST_NODE_TYPES.ThisExpression, {})
      );
      expect(getMethodName(call)).toBeNull();
    });

    it("returns null for member expression with non-identifier, non-literal property", () => {
      const call = mockCallExpression(
        mockMemberExpression(
          mockIdentifier("obj"),
          mockNode<TSESTree.Expression>(AST_NODE_TYPES.ThisExpression, {})
        )
      );
      expect(getMethodName(call)).toBeNull();
    });
  });

  describe("getCaller", () => {
    it("returns object for member expression callee", () => {
      const object = mockIdentifier("obj");
      const call = mockCallExpression(
        mockMemberExpression(object, mockIdentifier("map"))
      );
      expect(getCaller(call)).toBe(object);
    });

    it("returns null for identifier callee", () => {
      const call = mockCallExpression(mockIdentifier("map"));
      expect(getCaller(call)).toBeNull();
    });
  });

  describe("isMethodCall", () => {
    it("returns true for call with member expression callee", () => {
      const call = mockCallExpression(
        mockMemberExpression(mockIdentifier("obj"), mockIdentifier("map"))
      );
      expect(isMethodCall(call)).toBe(true);
    });

    it("returns false for call with identifier callee", () => {
      const call = mockCallExpression(mockIdentifier("map"));
      expect(isMethodCall(call)).toBe(false);
    });

    it("returns false for non-call node", () => {
      const node = mockIdentifier("x");
      expect(isMethodCall(node)).toBe(false);
    });
  });

  describe("isObjectOfMethodCall", () => {
    it("returns true when node is object of a member expression in a call", () => {
      const call = mockCallExpression(mockIdentifier("chain"));
      const memberExpression = mockMemberExpression(
        call,
        mockIdentifier("map")
      );
      const outerCall = mockCallExpression(memberExpression);
      call.parent = memberExpression;
      memberExpression.parent = outerCall;

      expect(isObjectOfMethodCall(call)).toBe(true);
    });

    it("returns false when parent is not a member expression", () => {
      const call = mockCallExpression(mockIdentifier("map"));
      const parent = mockNode<TSESTree.ExpressionStatement>(
        AST_NODE_TYPES.ExpressionStatement,
        { expression: call }
      );
      call.parent = parent;
      expect(isObjectOfMethodCall(call)).toBe(false);
    });

    it("returns false when node is not the object of the parent member expression", () => {
      const other = mockIdentifier("other");
      const call = mockCallExpression(mockIdentifier("chain"));
      const memberExpression = mockMemberExpression(
        other,
        mockIdentifier("map")
      );
      call.parent = memberExpression;
      expect(isObjectOfMethodCall(call)).toBe(false);
    });

    it("returns false when parent.parent is not a call expression", () => {
      const call = mockCallExpression(mockIdentifier("chain"));
      const memberExpression = mockMemberExpression(
        call,
        mockIdentifier("map")
      );
      const notCall = mockNode<TSESTree.ExpressionStatement>(
        AST_NODE_TYPES.ExpressionStatement,
        { expression: memberExpression }
      );
      call.parent = memberExpression;
      memberExpression.parent = notCall;
      expect(isObjectOfMethodCall(call)).toBe(false);
    });
  });

  describe("isExplicitChainStart", () => {
    it("returns true for chain identifier call", () => {
      const call = mockCallExpression(mockIdentifier("chain"));
      expect(isExplicitChainStart(call)).toBe(true);
    });

    it("returns false for non-chain identifier call", () => {
      const call = mockCallExpression(mockIdentifier("map"));
      expect(isExplicitChainStart(call)).toBe(false);
    });

    it("returns false for member expression call", () => {
      const call = mockCallExpression(
        mockMemberExpression(mockIdentifier("obj"), mockIdentifier("chain"))
      );
      expect(isExplicitChainStart(call)).toBe(false);
    });
  });
});

describe("chain breaker and chainable tests", () => {
  describe("isChainBreaker", () => {
    it.each([
      { expected: true, method: "value" },
      { expected: true, method: "toJSON" },
      { expected: true, method: "valueOf" },
      { expected: false, method: "map" }
    ])("returns $expected for $method method call", ({ expected, method }) => {
      const call = mockCallExpression(
        mockMemberExpression(mockIdentifier("chain"), mockIdentifier(method))
      );
      expect(isChainBreaker(call)).toBe(expected);
    });

    it(nullMethodNameTestDescription, () => {
      const call = mockCallExpression(
        mockNode<TSESTree.Expression>(AST_NODE_TYPES.ThisExpression, {})
      );
      expect(isChainBreaker(call)).toBe(false);
    });

    it("returns false for member expression with computed property", () => {
      const call = mockCallExpression(mockComputedMember());
      expect(isChainBreaker(call)).toBe(false);
    });
  });

  describe("isChainable", () => {
    it("returns true for chainable method call", () => {
      const call = mockCallExpression(
        mockMemberExpression(mockIdentifier("chain"), mockIdentifier("map"))
      );
      expect(isChainable(call)).toBe(true);
    });

    it("returns false for non-chainable method call", () => {
      const call = mockCallExpression(
        mockMemberExpression(mockIdentifier("chain"), mockIdentifier("add"))
      );
      expect(isChainable(call)).toBe(false);
    });

    it(nullMethodNameTestDescription, () => {
      const call = mockCallExpression(
        mockNode<TSESTree.Expression>(AST_NODE_TYPES.ThisExpression, {})
      );
      expect(isChainable(call)).toBe(false);
    });

    it("returns false for member expression with computed property", () => {
      const call = mockCallExpression(mockComputedMember());
      expect(isChainable(call)).toBe(false);
    });
  });
});

describe("chain end and call tests", () => {
  describe("getEndOfChain", () => {
    it("returns start node when there is no parent", () => {
      const start = mockCallExpression(mockIdentifier(chainMethodName));
      expect(getEndOfChain(start, true)).toBe(start);
    });

    it("walks up explicit chain to chain breaker", () => {
      const chainCall = mockCallExpression(mockIdentifier(chainMethodName));
      const mapMember = mockMemberExpression(
        chainCall,
        mockIdentifier(mapMethodName)
      );
      const mapCall = mockCallExpression(mapMember);
      const valueMember = mockMemberExpression(
        mapCall,
        mockIdentifier("value")
      );
      const valueCall = mockCallExpression(valueMember);

      chainCall.parent = mapMember;
      mapMember.parent = mapCall;
      mapCall.parent = valueMember;
      valueMember.parent = valueCall;

      expect(getEndOfChain(chainCall, true)).toBe(valueCall);
    });

    it("walks up implicit chain while chainable", () => {
      const chainCall = mockCallExpression(mockIdentifier("chain"));
      const mapMember = mockMemberExpression(chainCall, mockIdentifier("map"));
      const mapCall = mockCallExpression(mapMember);
      const appendMember = mockMemberExpression(mapCall, mockIdentifier("add"));
      const appendCall = mockCallExpression(appendMember);

      chainCall.parent = mapMember;
      mapMember.parent = mapCall;
      mapCall.parent = appendMember;
      appendMember.parent = appendCall;

      expect(getEndOfChain(chainCall, false)).toBe(appendCall);
    });

    it("stops when next call caller is not current", () => {
      const chainCall = mockCallExpression(mockIdentifier("chain"));
      const mapMember = mockMemberExpression(chainCall, mockIdentifier("map"));
      const mapCall = mockCallExpression(mapMember);
      const otherObject = mockIdentifier("other");
      const unrelatedMember = mockMemberExpression(
        otherObject,
        mockIdentifier("filter")
      );
      const unrelatedCall = mockCallExpression(unrelatedMember);

      chainCall.parent = mapMember;
      mapMember.parent = mapCall;
      mapCall.parent = unrelatedMember;
      unrelatedMember.parent = unrelatedCall;

      expect(getEndOfChain(chainCall, false)).toBe(mapCall);
    });

    it("stops when current is not chainable in implicit mode", () => {
      const chainCall = mockCallExpression(mockIdentifier("chain"));
      const memberWithAdd = mockMemberExpression(
        chainCall,
        mockIdentifier("add")
      );
      const callWithAdd = mockCallExpression(memberWithAdd);
      const filterMember = mockMemberExpression(
        callWithAdd,
        mockIdentifier("filter")
      );
      const filterCall = mockCallExpression(filterMember);

      chainCall.parent = memberWithAdd;
      memberWithAdd.parent = callWithAdd;
      callWithAdd.parent = filterMember;
      filterMember.parent = filterCall;

      expect(getEndOfChain(chainCall, false)).toBe(callWithAdd);
    });
  });

  describe("isCallToMethod", () => {
    it("returns true when method name matches", () => {
      const call = mockCallExpression(
        mockMemberExpression(mockIdentifier("obj"), mockIdentifier("map"))
      );
      expect(isCallToMethod(call, "map")).toBe(true);
    });

    it("returns false when method name does not match", () => {
      const call = mockCallExpression(
        mockMemberExpression(mockIdentifier("obj"), mockIdentifier("map"))
      );
      expect(isCallToMethod(call, "filter")).toBe(false);
    });

    it(nullMethodNameTestDescription, () => {
      const call = mockCallExpression(
        mockNode<TSESTree.Expression>(AST_NODE_TYPES.ThisExpression, {})
      );
      expect(isCallToMethod(call, "map")).toBe(false);
    });
  });
});
