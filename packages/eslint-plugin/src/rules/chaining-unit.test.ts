import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  type ChainingContext,
  chainingRule,
  isNestedNLevels,
  reportOnSingleChain
} from "./chaining.ts";

const mockNode = <T extends TSESTree.Node>(
  type: T["type"],
  properties: Partial<T> = {}
) => {
  return { type, ...properties } as unknown as T;
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

const mockIdentifier = (name: string) => {
  return mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, { name });
};

describe("chaining unit tests", () => {
  it("isNestedNLevels returns true at depth 1 for lodash identifier call", () => {
    const call = mockCallExpression(mockIdentifier("map"));
    expect(isNestedNLevels(call, 1, true)).toBe(true);
  });

  it("isNestedNLevels returns false at depth 1 for non-lodash identifier call", () => {
    const call = mockCallExpression(mockIdentifier("notLodash"));
    expect(isNestedNLevels(call, 1, true)).toBe(false);
  });

  it("isNestedNLevels returns false when depth > 1 and argument is not a call expression", () => {
    const call = mockCallExpression(mockIdentifier("map"), [
      mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, { name: "arr" })
    ]);
    expect(isNestedNLevels(call, 2, true)).toBe(false);
  });

  it("isNestedNLevels returns false when depth > 1 and first argument is undefined", () => {
    const call = mockCallExpression(mockIdentifier("map"), []);
    expect(isNestedNLevels(call, 2, true)).toBe(false);
  });

  it("isNestedNLevels returns false when depth > 1 and outer is not a lodash call", () => {
    const inner = mockCallExpression(mockIdentifier("map"));
    const outer = mockCallExpression(mockIdentifier("notLodash"), [inner]);
    expect(isNestedNLevels(outer, 2, true)).toBe(false);
  });

  it("isNestedNLevels returns false for non-chainable method in implicit mode", () => {
    const inner = mockCallExpression(mockIdentifier("map"));
    const outer = mockCallExpression(mockIdentifier("add"), [inner]);
    expect(isNestedNLevels(outer, 2, false)).toBe(false);
  });

  it("isNestedNLevels returns true for chainable method in implicit mode", () => {
    const inner = mockCallExpression(mockIdentifier("map"));
    const outer = mockCallExpression(mockIdentifier("filter"), [inner]);
    expect(isNestedNLevels(outer, 2, false)).toBe(true);
  });

  it("reportOnSingleChain reports when method call is followed by chain breaker", () => {
    const reports: { messageId: string }[] = [];
    const context = {
      report: (report: { messageId: string }) => {
        reports.push(report);
      }
    } as unknown as ChainingContext;

    const memberExpression = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        object: mockCallExpression(mockIdentifier("chain")),
        property: mockIdentifier("map")
      }
    );
    const call = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        arguments: [mockIdentifier("fn")],
        callee: memberExpression
      }
    );
    const parent = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      { object: call, property: mockIdentifier("value") }
    );
    const grandParent = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      { arguments: [], callee: parent }
    );
    call.parent = parent;
    parent.parent = grandParent;

    reportOnSingleChain(call, context);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.messageId).toBe("single");
  });

  it("reportOnSingleChain does not report when isMethodCall returns false", () => {
    const reports: { messageId: string }[] = [];
    const context = {
      report: (report: { messageId: string }) => {
        reports.push(report);
      }
    } as unknown as ChainingContext;

    const expressionStatement = mockNode<TSESTree.ExpressionStatement>(
      AST_NODE_TYPES.ExpressionStatement,
      { expression: mockIdentifier("x") }
    );
    const identifierCallee = mockIdentifier("map");
    const call = mockCallExpression(identifierCallee, [mockIdentifier("arr")]);
    call.parent = expressionStatement;

    reportOnSingleChain(call, context);
    expect(reports).toHaveLength(0);
  });

  it("reportOnSingleChain reports when method call is not object of another call (standalone)", () => {
    const reports: { messageId: string }[] = [];
    const context = {
      report: (report: { messageId: string }) => {
        reports.push(report);
      }
    } as unknown as ChainingContext;

    const memberExpression = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        object: mockCallExpression(mockIdentifier("chain")),
        property: mockIdentifier("map")
      }
    );
    const call = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        arguments: [mockIdentifier("fn")],
        callee: memberExpression
      }
    );
    const parent = mockNode<TSESTree.ExpressionStatement>(
      AST_NODE_TYPES.ExpressionStatement,
      { expression: call }
    );
    call.parent = parent;

    reportOnSingleChain(call, context);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.messageId).toBe("single");
  });

  it("chainingRule metadata has correct description and type", () => {
    expect(chainingRule.meta.docs?.description).toContain("chain");
    expect(chainingRule.meta.type).toBe("suggestion");
  });

  it("chainingRule schema has two items", () => {
    expect(chainingRule.meta.schema).toHaveLength(2);
  });
});
