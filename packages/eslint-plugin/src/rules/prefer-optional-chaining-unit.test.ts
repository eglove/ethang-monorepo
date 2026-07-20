import { type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { detectOptionalChainingPattern } from "./prefer-optional-chaining.ts";
import { findFirstNode, parseProgram } from "./.fixture.ts";

describe("prefer-optional-chaining", () => {
  describe("detectOptionalChainingPattern", () => {
    it("detects 'x && x.foo'", () => {
      const program = parseProgram("x && x.foo;");
      const logical = findFirstNode(program, (n): n is TSESTree.LogicalExpression => n.type === "LogicalExpression");
      expect(logical).not.toBeNull();
      if (logical) {
        expect(detectOptionalChainingPattern(logical)).toBe(true);
      }
    });

    it("detects 'x && x['foo']'", () => {
      const program = parseProgram("x && x['foo'];");
      const logical = findFirstNode(program, (n): n is TSESTree.LogicalExpression => n.type === "LogicalExpression");
      expect(logical).not.toBeNull();
      if (logical) {
        expect(detectOptionalChainingPattern(logical)).toBe(true);
      }
    });

    it("does not detect 'x && y'", () => {
      const program = parseProgram("x && y;");
      const logical = findFirstNode(program, (n): n is TSESTree.LogicalExpression => n.type === "LogicalExpression");
      expect(logical).not.toBeNull();
      if (logical) {
        expect(detectOptionalChainingPattern(logical)).toBe(false);
      }
    });

    it("does not detect 'x || x.foo'", () => {
      const program = parseProgram("x || x.foo;");
      const logical = findFirstNode(program, (n): n is TSESTree.LogicalExpression => n.type === "LogicalExpression");
      expect(logical).not.toBeNull();
      if (logical) {
        expect(detectOptionalChainingPattern(logical)).toBe(false);
      }
    });

    it("does not detect 'x && x.foo && x.bar' (multi-chain, handled by prefer-get)", () => {
      const program = parseProgram("x && x.foo && x.bar;");
      const logical = findFirstNode(program, (n): n is TSESTree.LogicalExpression => n.type === "LogicalExpression");
      expect(logical).not.toBeNull();
      if (logical) {
        expect(detectOptionalChainingPattern(logical)).toBe(false);
      }
    });

    it("does not detect 'x > 0 && x < 10'", () => {
      const program = parseProgram("x > 0 && x < 10;");
      const logical = findFirstNode(program, (n): n is TSESTree.LogicalExpression => n.type === "LogicalExpression");
      expect(logical).not.toBeNull();
      if (logical) {
        expect(detectOptionalChainingPattern(logical)).toBe(false);
      }
    });

    it("does not detect 'x && fn(x)'", () => {
      const program = parseProgram("x && fn(x);");
      const logical = findFirstNode(program, (n): n is TSESTree.LogicalExpression => n.type === "LogicalExpression");
      expect(logical).not.toBeNull();
      if (logical) {
        expect(detectOptionalChainingPattern(logical)).toBe(false);
      }
    });
  });
});
