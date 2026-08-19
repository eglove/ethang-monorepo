import { describe, expect, it } from "vitest";

import {
  isBinaryExpression,
  isCallExpression
} from "./../utils/type-guards.ts";
import { findFirstNode, parseProgram } from "./.fixture.ts";
import { isInstanceofError } from "./prefer-effect-cause.ts";

describe("prefer-effect-cause", () => {
  describe("isInstanceofError", () => {
    it.each([
      ["x instanceof Error", true],
      ["x instanceof TypeError", true],
      ["x instanceof SyntaxError", true],
      ["x instanceof ReferenceError", true],
      ["x instanceof RangeError", true],
      ["x instanceof URIError", true],
      ["x instanceof EvalError", true],
      ["x instanceof AggregateError", true],
      ["x instanceof CustomError", true],
      ["x instanceof ValidationError", true],
      ["x instanceof ApiError", true],
      ["x instanceof Array", false],
      ["x instanceof Map", false],
      ["x instanceof Set", false],
      ["x instanceof Date", false],
      ["x instanceof RegExp", false],
      ["x instanceof Function", false],
      ["x instanceof Object", false],
      ["x instanceof String", false],
      ["x instanceof Number", false],
      ["x instanceof Boolean", false],
      ["x instanceof Promise", false],
      ["x instanceof Symbol", false],
      ["x instanceof SomeClass", false],
      ["x instanceof (Error || TypeError)", false],
      ["x === Error", false]
    ])("detects '%s' as instanceof Error: %s", (code, expected) => {
      const program = parseProgram(`${code};`);
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      expect(binary && isInstanceofError(binary)).toBe(expected);
    });

    it("returns false for non-binary expression", () => {
      const program = parseProgram("Error();");
      const call = findFirstNode(program, isCallExpression);
      expect(call).not.toBeNull();
      expect(call && isInstanceofError(call)).toBe(false);
    });

    it("detects instanceof Error with member expression left side", () => {
      const program = parseProgram("foo.bar instanceof Error;");
      const binary = findFirstNode(program, isBinaryExpression);
      expect(binary).not.toBeNull();
      expect(binary && isInstanceofError(binary)).toBe(true);
    });
  });
});
