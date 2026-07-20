import type { TSESTree } from "@typescript-eslint/utils";

import { describe, expect, it } from "vitest";

import {
  isBinaryExpression,
  isMemberExpression
} from "./../utils/type-guards.ts";
import { findFirstNode, parseProgram } from "./.fixture.ts";
import { detectSymbolIteratorIn } from "./prefer-effect-predicate-is-iterable.ts";

const isBinary = (n: TSESTree.Node): n is TSESTree.BinaryExpression => {
  return isBinaryExpression(n);
};

const isMember = (n: TSESTree.Node): n is TSESTree.MemberExpression => {
  return isMemberExpression(n);
};

describe("prefer-effect-predicate-is-iterable", () => {
  describe("detectSymbolIteratorIn", () => {
    it.each([
      ["Symbol.iterator in x", true],
      ["Symbol.iterator in obj", true],
      ["Symbol.iterator === x", false],
      ["x in y", false],
      ["Symbol.toStringTag in x", false],
      ["Symbol.hasInstance in x", false]
    ])("detects %s as %s", (code, expected) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, isBinary);
      expect(binary).not.toBeNull();
      expect(binary && detectSymbolIteratorIn(binary)).toBe(expected);
    });

    it("returns false when left.object is not an Identifier (line 33)", () => {
      // `getSymbol().iterator` is a MemberExpression where object is CallExpression
      const program = parseProgram("getSymbol().iterator in x;");
      const binary = findFirstNode(program, isBinary);
      expect(binary).not.toBeNull();
      // This hits line 33: !isIdentifier(left.object) returns true
      expect(binary && detectSymbolIteratorIn(binary)).toBe(false);
    });

    it("returns false for computed property with non-Identifier expression (line 36)", () => {
      // This tests when left.computed=true and left.property is not an Identifier
      const program = parseProgram("Symbol[getProp()] in x;");
      const binary = findFirstNode(program, isBinary);
      expect(binary).not.toBeNull();
      // This hits line 36: !isIdentifier(left.property) returns true
      expect(binary && detectSymbolIteratorIn(binary)).toBe(false);
    });

    it("returns false for non-binary expression", () => {
      const program = parseProgram("Symbol.iterator;");
      const member = findFirstNode(program, isMember);
      expect(member).not.toBeNull();
      expect(member && detectSymbolIteratorIn(member)).toBe(false);
    });
  });
});