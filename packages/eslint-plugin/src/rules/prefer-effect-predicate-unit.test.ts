import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  isBinaryExpression,
  isCallExpression,
  isUnaryExpression
} from "./../utils/type-guards.ts";
import { findFirstNode, parseProgram } from "./.fixture.ts";
import {
  detectInstanceofPredicate,
  detectPredicateRecommendation,
  getStringLiteral,
  getTypeofLiteral,
  isTypeofExpression,
  resolveTypeofPredicate
} from "./prefer-effect-predicate.ts";

const BIGINT = "bigint";
const SYMBOL = "symbol";
const STRING = "string";
const NUMBER = "number";

describe("prefer-effect-predicate", () => {
  describe("isTypeofExpression", () => {
    it.each(["typeof x", "typeof foo()"])(
      "detects typeof expression for '%s'",
      (code) => {
        const program = parseProgram(`${code};`);
        const expression = findFirstNode(program, isUnaryExpression);
        expect(expression).not.toBeNull();
        expect(expression && isTypeofExpression(expression)).toBe(true);
      }
    );

    it.each(["void x", "delete obj.key", "!x"])(
      "does not detect non-typeof unary expression for '%s'",
      (code) => {
        const program = parseProgram(`${code};`);
        const expression = findFirstNode(program, isUnaryExpression);
        expect(expression).not.toBeNull();
        expect(expression && isTypeofExpression(expression)).toBe(false);
      }
    );
  });

  describe("getStringLiteral", () => {
    it.each([
      [`"hello"`, "hello"],
      [`"world"`, "world"],
      [`"key"`, "key"]
    ])("returns string value for string literal '%s'", (code, expected) => {
      const program = parseProgram(`${code};`);
      const literal = findFirstNode(program, (n) => {
        return AST_NODE_TYPES.Literal === n.type;
      });
      expect(literal).not.toBeNull();
      expect(literal && getStringLiteral(literal)).toBe(expected);
    });

    it("returns null when literal value is not a string (line 60)", () => {
      // This tests when expression.type is Literal but expression.value is not a string
      const program = parseProgram("typeof x === 123;");
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      // binary.left is UnaryExpression, binary.right is Literal(123) - a number
      // This tests the branch where expression.value is a number, not a string
      expect(binary && getTypeofLiteral(binary)).toBeNull();
    });

    it("returns null for non-literal expression", () => {
      const program = parseProgram("typeof x;");
      const unary = findFirstNode(program, isUnaryExpression);
      expect(unary).not.toBeNull();
      expect(unary && getStringLiteral(unary)).toBeNull();
    });
  });

  describe("getTypeofLiteral", () => {
    it.each([
      [`typeof x === "${BIGINT}"`, BIGINT],
      [`typeof x === "${SYMBOL}"`, SYMBOL],
      [`typeof x === "${STRING}"`, STRING],
      [`typeof x === "${NUMBER}"`, NUMBER],
      [`"${BIGINT}" === typeof x`, BIGINT],
      [`typeof x !== "${BIGINT}"`, BIGINT],
      [`"${SYMBOL}" !== typeof x`, SYMBOL]
    ])("getTypeofLiteral('%s') → '%s'", (code, expected) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      expect(binary && getTypeofLiteral(binary)).toBe(expected);
    });

    it.each(['typeof x == "bigint"', 'x === "bigint"', "typeof x", "x === y"])(
      "returns null for non-matching pattern '%s'",
      (code) => {
        const program = parseProgram(`${code};`);
        const binary = findFirstNode(program, isBinaryExpression);
        expect(binary && getTypeofLiteral(binary)).toBeNull();
      }
    );

    it("returns null when typeof expression value is not a string literal", () => {
      const program = parseProgram("typeof x === foo;");
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      // binary.left is UnaryExpression (typeof x), binary.right is Identifier (foo)
      expect(binary && getTypeofLiteral(binary)).toBeNull();
    });
  });

  describe("resolveTypeofPredicate", () => {
    it.each([`typeof x === "${BIGINT}"`, `typeof x === "${SYMBOL}"`])(
      "resolves predicate for '%s'",
      (code) => {
        const program = parseProgram(`${code};`);
        const binary = findFirstNode(program, isBinaryExpression);
        expect(binary).not.toBeNull();
        const result = binary && resolveTypeofPredicate(binary);
        expect(result).not.toBeNull();
        expect(result?.messageId).toBeDefined();
      }
    );

    it.each([
      'typeof x === "string"',
      'typeof x === "number"',
      'typeof x === "object"',
      'typeof x === "boolean"',
      'typeof x === "function"',
      'typeof x === "undefined"'
    ])("returns null for non-predicate typeof '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      expect(binary && resolveTypeofPredicate(binary)).toBeNull();
    });

    it("returns null for non-string literal from typeof expression", () => {
      const program = parseProgram("typeof x === foo;");
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      // Tests the branch where expression.value is not a string at line 60
      expect(binary && resolveTypeofPredicate(binary)).toBeNull();
    });
  });

  describe("detectPredicateRecommendation", () => {
    it.each([`typeof x === "${BIGINT}"`, `typeof x === "${SYMBOL}"`])(
      "detects typeof predicate for '%s'",
      (code) => {
        const program = parseProgram(`${code};`);
        const binary = findFirstNode(program, isBinaryExpression);
        expect(binary).not.toBeNull();
        expect(binary && detectPredicateRecommendation(binary)).not.toBeNull();
      }
    );

    it.each([
      'typeof x === "string"',
      'typeof x === "number"',
      "x instanceof Object",
      "x instanceof Array",
      "x === y",
      "x > 0"
    ])("returns null for non-predicate '%s'", (code) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      expect(binary && detectPredicateRecommendation(binary)).toBeNull();
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
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      expect(binary && detectInstanceofPredicate(binary)).not.toBeNull();
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
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      expect(binary && detectInstanceofPredicate(binary)).toBeNull();
    });

    it("returns null for non-binary expression", () => {
      const program = parseProgram("Date.now();");
      const call = findFirstNode(program, isCallExpression);
      expect(call).not.toBeNull();
      expect(call && detectInstanceofPredicate(call)).toBeNull();
    });

    it("returns null when instanceof right side is not an identifier", () => {
      const program = parseProgram("x instanceof (Date || Error);");
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      // Tests the branch where right.type is not Identifier (line 129)
      expect(binary && detectInstanceofPredicate(binary)).toBeNull();
    });
  });
});
