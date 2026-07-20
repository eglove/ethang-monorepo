import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findFirstNode, parseProgram } from "./.fixture.ts";
import { isObjectFromEntriesCall } from "./prefer-lodash-from-pairs.ts";

function findCall(
  code: string
): { call: TSESTree.CallExpression; program: TSESTree.Program } {
  const program = parseProgram(code);
  const call = findFirstNode(program, (n) => n.type === AST_NODE_TYPES.CallExpression);
  expect(call).not.toBeNull();
  return { call: call!, program };
}

describe("prefer-lodash-from-pairs", () => {
  describe("isObjectFromEntriesCall", () => {
    it.each([
      ["Object.fromEntries(pairs)", true],
      ["Object.keys(obj)", false],
      ["Object.entries(obj)", false],
      ["fn(pairs)", false],
      ["Object.fromEntries()", false],
      ["Object.fromEntries(a, b)", false],
      // Line 33: callee.computed=true
      ["Object['fromEntries'](pairs)", false],
      // Line 35: callee.object is not "Object"
      ["Other.fromEntries(pairs)", false],
      // Line 39-40: callee.property is not "fromEntries"
      ["Object.keys(obj)", false]
    ])("returns %s for '%s'", (code, expected) => {
      const { call } = findCall(code);
      expect(isObjectFromEntriesCall(call)).toBe(expected);
    });

    it("returns false for non-CallExpression (line 23)", () => {
      // Line 23: when node.type is NOT CallExpression
      const program = parseProgram("someIdentifier;");
      const identifier = findFirstNode(program, (n) => n.type === AST_NODE_TYPES.Identifier);
      expect(identifier).not.toBeNull();
      expect(identifier && isObjectFromEntriesCall(identifier)).toBe(false);
    });
  });
});