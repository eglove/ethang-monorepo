import { type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { detectSymbolIteratorIn } from "./prefer-effect-predicate-is-iterable.ts";
import { findFirstNode, parseProgram } from "./.fixture.ts";

describe("prefer-effect-predicate-is-iterable", () => {
  describe("detectSymbolIteratorIn", () => {
    it("detects 'Symbol.iterator in x'", () => {
      const program = parseProgram("Symbol.iterator in x;");
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(detectSymbolIteratorIn(binary)).toBe(true);
      }
    });

    it("detects 'Symbol.iterator in obj'", () => {
      const program = parseProgram("Symbol.iterator in obj;");
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(detectSymbolIteratorIn(binary)).toBe(true);
      }
    });

    it("does not detect 'Symbol.iterator === x'", () => {
      const program = parseProgram("Symbol.iterator === x;");
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(detectSymbolIteratorIn(binary)).toBe(false);
      }
    });

    it("does not detect 'x in y'", () => {
      const program = parseProgram("x in y;");
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(detectSymbolIteratorIn(binary)).toBe(false);
      }
    });

    it("does not detect 'Symbol.toStringTag in x'", () => {
      const program = parseProgram("Symbol.toStringTag in x;");
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(detectSymbolIteratorIn(binary)).toBe(false);
      }
    });

    it("does not detect 'Symbol.hasInstance in x'", () => {
      const program = parseProgram("Symbol.hasInstance in x;");
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(detectSymbolIteratorIn(binary)).toBe(false);
      }
    });

    it("does not detect non-binary expression", () => {
      const program = parseProgram("Symbol.iterator;");
      const member = findFirstNode(program, (n): n is TSESTree.MemberExpression => n.type === "MemberExpression");
      expect(member).not.toBeNull();
      if (member) {
        expect(detectSymbolIteratorIn(member)).toBe(false);
      }
    });
  });
});