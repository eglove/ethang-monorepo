import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  detectUniqPattern,
  getSetArgument,
  isArrayFromNewSet,
  isSpreadOfNewSet
} from "./prefer-lodash-uniq.ts";
import { findCall, findFirstNode, parseProgram } from "./.fixture.ts";

describe("prefer-lodash-uniq", () => {
  describe("isSpreadOfNewSet", () => {
    it("returns true for [...new Set(arr)]", () => {
      const program = parseProgram("[...new Set(arr)]");
      const arrayExpr = findFirstNode(program, (n): n is TSESTree.ArrayExpression => AST_NODE_TYPES.ArrayExpression === n.type);
      expect(arrayExpr).not.toBeNull();
      if (arrayExpr) {
        expect(isSpreadOfNewSet(arrayExpr)).toBe(true);
      }
    });

    it("returns false for [...new Map(arr)]", () => {
      const program = parseProgram("[...new Map(arr)]");
      const arrayExpr = findFirstNode(program, (n): n is TSESTree.ArrayExpression => AST_NODE_TYPES.ArrayExpression === n.type);
      expect(arrayExpr).not.toBeNull();
      if (arrayExpr) {
        expect(isSpreadOfNewSet(arrayExpr)).toBe(false);
      }
    });

    it("returns false for plain array literal", () => {
      const program = parseProgram("[a, b]");
      const arrayExpr = findFirstNode(program, (n): n is TSESTree.ArrayExpression => AST_NODE_TYPES.ArrayExpression === n.type);
      expect(arrayExpr).not.toBeNull();
      if (arrayExpr) {
        expect(isSpreadOfNewSet(arrayExpr)).toBe(false);
      }
    });

    it("returns false for spread of non-Set", () => {
      const program = parseProgram("[...fn()]");
      const arrayExpr = findFirstNode(program, (n): n is TSESTree.ArrayExpression => AST_NODE_TYPES.ArrayExpression === n.type);
      expect(arrayExpr).not.toBeNull();
      if (arrayExpr) {
        expect(isSpreadOfNewSet(arrayExpr)).toBe(false);
      }
    });
  });

  describe("isArrayFromNewSet", () => {
    it("returns true for Array.from(new Set(arr))", () => {
      const { call } = findCall("Array.from(new Set(arr))");
      expect(isArrayFromNewSet(call)).toBe(true);
    });

    it("returns false for Array.from(arr)", () => {
      const { call } = findCall("Array.from(arr)");
      expect(isArrayFromNewSet(call)).toBe(false);
    });

    it("returns false for Array.from(new Map(arr))", () => {
      const { call } = findCall("Array.from(new Map(arr))");
      expect(isArrayFromNewSet(call)).toBe(false);
    });
  });

  describe("getSetArgument", () => {
    it("extracts inner expression from new Set(arr)", () => {
      const { call } = findCall("Array.from(new Set(arr))");
      const setArg = call.arguments[0];
      if (setArg && setArg.type === AST_NODE_TYPES.NewExpression) {
        const inner = getSetArgument(setArg);
        expect(inner).not.toBeNull();
      }
    });

    it("returns null when Set has no arguments", () => {
      const { call } = findCall("Array.from(new Set())");
      const setArg = call.arguments[0];
      if (setArg && setArg.type === AST_NODE_TYPES.NewExpression) {
        expect(getSetArgument(setArg)).toBeNull();
      }
    });
  });

  describe("detectUniqPattern", () => {
    it("detects spread-set pattern", () => {
      const program = parseProgram("[...new Set(arr)]");
      const arrayExpr = findFirstNode(program, (n): n is TSESTree.ArrayExpression => AST_NODE_TYPES.ArrayExpression === n.type);
      expect(arrayExpr).not.toBeNull();
      if (arrayExpr) {
        const match = detectUniqPattern(arrayExpr);
        expect(match).not.toBeNull();
        expect(match?.kind).toBe("spread-set");
      }
    });

    it("detects array-from-set pattern", () => {
      const { call } = findCall("Array.from(new Set(arr))");
      const match = detectUniqPattern(call);
      expect(match).not.toBeNull();
      expect(match?.kind).toBe("array-from-set");
    });

    it("returns null for unrelated call", () => {
      const { call } = findCall("arr.map(x => x * 2)");
      expect(detectUniqPattern(call)).toBeNull();
    });

    it("returns null for [...new Map(arr)]", () => {
      const program = parseProgram("[...new Map(arr)]");
      const arrayExpr = findFirstNode(program, (n): n is TSESTree.ArrayExpression => AST_NODE_TYPES.ArrayExpression === n.type);
      expect(arrayExpr).not.toBeNull();
      if (arrayExpr) {
        expect(detectUniqPattern(arrayExpr)).toBeNull();
      }
    });

    it("returns null for Array.from(arr)", () => {
      const { call } = findCall("Array.from(arr)");
      expect(detectUniqPattern(call)).toBeNull();
    });

    it("returns null for new Set() with no arguments", () => {
      const { call } = findCall("Array.from(new Set())");
      expect(detectUniqPattern(call)).toBeNull();
    });
  });
});
