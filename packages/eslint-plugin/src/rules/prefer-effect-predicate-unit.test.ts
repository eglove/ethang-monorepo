import { type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  detectInstanceofPredicate,
  detectPredicateRecommendation,
  getTypeofLiteral,
  isTypeofExpression,
  resolveTypeofPredicate
} from "./prefer-effect-predicate.ts";
import { findFirstNode, parseProgram } from "./.fixture.ts";

describe("prefer-effect-predicate", () => {
  describe("isTypeofExpression", () => {
    it.each([
      "typeof x",
      "typeof foo()"
    ])("detects typeof expression for '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const expr = findFirstNode(program, (n): n is TSESTree.UnaryExpression => n.type === "UnaryExpression");
      expect(expr).not.toBeNull();
      if (expr) {
        expect(isTypeofExpression(expr)).toBe(true);
      }
    });

    it.each([
      "void x",
      "delete obj.key",
      "!x"
    ])("does not detect non-typeof unary expression for '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const expr = findFirstNode(program, (n): n is TSESTree.UnaryExpression => n.type === "UnaryExpression");
      expect(expr).not.toBeNull();
      if (expr) {
        expect(isTypeofExpression(expr)).toBe(false);
      }
    });
  });

  describe("getTypeofLiteral", () => {
    it.each([
      ['typeof x === "bigint"', "bigint"],
      ['typeof x === "symbol"', "symbol"],
      ['typeof x === "string"', "string"],
      ['typeof x === "number"', "number"],
      ['"bigint" === typeof x', "bigint"],
      ['typeof x !== "bigint"', "bigint"],
      ['"symbol" !== typeof x', "symbol"]
    ])("getTypeofLiteral('%s') → '%s'", (code, expected) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(getTypeofLiteral(binary)).toBe(expected);
      }
    });

    it.each([
      'typeof x == "bigint"',
      'x === "bigint"',
      'typeof x',
      'x === y'
    ])("returns null for non-matching pattern '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      if (binary) {
        expect(getTypeofLiteral(binary)).toBeNull();
      } else {
        // No binary expression — that's fine, test passes
      }
    });
  });

  describe("resolveTypeofPredicate", () => {
    it.each([
      'typeof x === "bigint"',
      'typeof x === "symbol"'
    ])("resolves predicate for '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        const result = resolveTypeofPredicate(binary);
        expect(result).not.toBeNull();
        expect(result?.messageId).toBeDefined();
      }
    });

    it.each([
      'typeof x === "string"',
      'typeof x === "number"',
      'typeof x === "object"',
      'typeof x === "boolean"',
      'typeof x === "function"',
      'typeof x === "undefined"',
      'typeof x === "object"'
    ])("returns null for non-predicate typeof '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(resolveTypeofPredicate(binary)).toBeNull();
      }
    });
  });

  describe("detectPredicateRecommendation", () => {
    it.each([
      'typeof x === "bigint"',
      'typeof x === "symbol"'
    ])("detects typeof predicate for '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(detectPredicateRecommendation(binary)).not.toBeNull();
      }
    });

    it.each([
      'typeof x === "string"',
      'typeof x === "number"',
      'x instanceof Object',
      'x instanceof Array',
      'x === y',
      'x > 0'
    ])("returns null for non-predicate '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(detectPredicateRecommendation(binary)).toBeNull();
      }
    });
  });

  describe("detectInstanceofPredicate", () => {
    it.each([
      "x instanceof Date",
      "x instanceof Error",
      "x instanceof Function",
      "x instanceof Map",
      "x instanceof Set"
    ])("detects instanceof predicate for '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(detectInstanceofPredicate(binary)).not.toBeNull();
      }
    });

    it.each([
      "x instanceof Object",
      "x instanceof Array",
      "x instanceof String",
      "x instanceof Number",
      "x === Date",
      "typeof x === 'object'",
      "x > 0"
    ])("returns null for non-predicate '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, (n): n is TSESTree.BinaryExpression => n.type === "BinaryExpression");
      expect(binary).not.toBeNull();
      if (binary) {
        expect(detectInstanceofPredicate(binary)).toBeNull();
      }
    });

    it("returns null for non-binary expression", () => {
      const program = parseProgram("Date.now();");
      const call = findFirstNode(program, (n): n is TSESTree.CallExpression => n.type === "CallExpression");
      expect(call).not.toBeNull();
      if (call) {
        expect(detectInstanceofPredicate(call)).toBeNull();
      }
    });
  });
});
