import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  chainStyleRule,
  getParentCall,
  reportAsNeeded,
  reportExplicit,
  reportImplicit
} from "./chain-style.ts";

type ChainStyleContext = Parameters<typeof reportAsNeeded>[1];

const mockNode = <T extends TSESTree.Node>(
  type: AST_NODE_TYPES | T["type"],
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

describe("chain-style unit tests", () => {
  it("getParentCall returns null when parent is undefined", () => {
    const node = mockNode<TSESTree.Expression>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    expect(getParentCall(node)).toBeNull();
  });

  it("getParentCall returns null when grandParent is undefined", () => {
    const parent = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      { computed: false }
    );
    const node = mockNode<TSESTree.Expression>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    node.parent = parent;
    expect(getParentCall(node)).toBeNull();
  });

  it("getParentCall returns null when grandParent is not a method call", () => {
    const grandParent = mockNode<TSESTree.Expression>(
      AST_NODE_TYPES.Identifier,
      { name: "x" }
    );
    const parent = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      { computed: false }
    );
    parent.parent = grandParent;
    const node = mockNode<TSESTree.Expression>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    node.parent = parent;
    expect(getParentCall(node)).toBeNull();
  });

  it("reportAsNeeded does not report for non-explicit-chain-start nodes", () => {
    const reports: { messageId: string }[] = [];
    const context = {
      report: (report: { messageId: string }) => {
        reports.push(report);
      }
    } as unknown as ChainStyleContext;

    const call = mockCallExpression(mockIdentifier("map"), [
      mockIdentifier("arr")
    ]);
    reportAsNeeded(call, context);
    expect(reports).toHaveLength(0);
  });

  it("reportImplicit reports for explicit chain start", () => {
    const reports: { messageId: string }[] = [];
    const context = {
      report: (report: { messageId: string }) => {
        reports.push(report);
      }
    } as unknown as ChainStyleContext;

    const chainCall = mockCallExpression(mockIdentifier("chain"), [
      mockIdentifier("arr")
    ]);
    reportImplicit(chainCall, context);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.messageId).toBe("noExplicit");
  });

  it("reportExplicit does not report for non-lodash calls", () => {
    const reports: { messageId: string }[] = [];
    const context = {
      report: (report: { messageId: string }) => {
        reports.push(report);
      }
    } as unknown as ChainStyleContext;

    const call = mockCallExpression(mockIdentifier("notLodash"), [
      mockIdentifier("arr")
    ]);
    const program = mockNode<TSESTree.Program>(AST_NODE_TYPES.Program, {});
    reportExplicit(call, context, program);
    expect(reports).toHaveLength(0);
  });

  it("reportExplicit does not report when first argument is not a call expression", () => {
    const reports: { messageId: string }[] = [];
    const context = {
      report: (report: { messageId: string }) => {
        reports.push(report);
      }
    } as unknown as ChainStyleContext;

    const inner = mockCallExpression(mockIdentifier("map"), [
      mockIdentifier("arr")
    ]);
    const program = mockNode<TSESTree.Program>(AST_NODE_TYPES.Program, {});
    reportExplicit(inner, context, program);
    expect(reports).toHaveLength(0);
  });

  it("chainStyleRule metadata has correct description and type", () => {
    expect(chainStyleRule.meta.docs?.description).toContain("chain");
    expect(chainStyleRule.meta.type).toBe("suggestion");
  });

  it("chainStyleRule schema has one item", () => {
    expect(chainStyleRule.meta.schema).toHaveLength(1);
  });
});
