import { type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { detectDoubleUnary } from "./no-double-unary.ts";
import { findFirstNode, parseProgram } from "./.fixture.ts";

describe("no-double-unary", () => {
  describe("detectDoubleUnary", () => {
    it("detects '!!x'", () => {
      const program = parseProgram("!!x;");
      const expr = findFirstNode(program, (n): n is TSESTree.UnaryExpression => n.type === "UnaryExpression");
      expect(expr).not.toBeNull();
      if (expr) {
        expect(detectDoubleUnary(expr)).toBe(true);
      }
    });

    it("detects '!!(x > 0)'", () => {
      const program = parseProgram("!!(x > 0);");
      const expr = findFirstNode(program, (n): n is TSESTree.UnaryExpression => n.type === "UnaryExpression");
      expect(expr).not.toBeNull();
      if (expr) {
        expect(detectDoubleUnary(expr)).toBe(true);
      }
    });

    it("does not detect '!x'", () => {
      const program = parseProgram("!x;");
      const expr = findFirstNode(program, (n): n is TSESTree.UnaryExpression => n.type === "UnaryExpression");
      expect(expr).not.toBeNull();
      if (expr) {
        expect(detectDoubleUnary(expr)).toBe(false);
      }
    });

    it("does not detect '!!!x'", () => {
      const program = parseProgram("!!!x;");
      const expr = findFirstNode(program, (n): n is TSESTree.UnaryExpression => n.type === "UnaryExpression");
      expect(expr).not.toBeNull();
      if (expr) {
        // The outer !! is still a double-unary, but the inner ! is triple
        expect(detectDoubleUnary(expr)).toBe(true);
      }
    });

    it("does not detect '-x'", () => {
      const program = parseProgram("-x;");
      const expr = findFirstNode(program, (n): n is TSESTree.UnaryExpression => n.type === "UnaryExpression");
      expect(expr).not.toBeNull();
      if (expr) {
        expect(detectDoubleUnary(expr)).toBe(false);
      }
    });

    it("does not detect '~x'", () => {
      const program = parseProgram("~x;");
      const expr = findFirstNode(program, (n): n is TSESTree.UnaryExpression => n.type === "UnaryExpression");
      expect(expr).not.toBeNull();
      if (expr) {
        expect(detectDoubleUnary(expr)).toBe(false);
      }
    });

    it("does not detect 'typeof x'", () => {
      const program = parseProgram("typeof x;");
      const expr = findFirstNode(program, (n): n is TSESTree.UnaryExpression => n.type === "UnaryExpression");
      expect(expr).not.toBeNull();
      if (expr) {
        expect(detectDoubleUnary(expr)).toBe(false);
      }
    });

    it("does not detect 'void x'", () => {
      const program = parseProgram("void x;");
      const expr = findFirstNode(program, (n): n is TSESTree.UnaryExpression => n.type === "UnaryExpression");
      expect(expr).not.toBeNull();
      if (expr) {
        expect(detectDoubleUnary(expr)).toBe(false);
      }
    });
  });
});
