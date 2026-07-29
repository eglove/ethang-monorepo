import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findCall, linkParents, parseProgram } from "./.fixture.ts";
import {
  detectAllocatePattern,
  detectArrayFromWithLengthObject,
  detectSpreadPattern,
  isArraySpreadMapPattern
} from "./prefer-effect-array-from-iterable.ts";

const getExpressionStatement = (code: string) => {
  const program = parseProgram(code);
  linkParents(program);
  const statement = program.body[0];
  if (!statement || AST_NODE_TYPES.ExpressionStatement !== statement.type) {
    throw new Error(`expected expression statement in: ${code}`);
  }
  return statement;
};

describe("detectSpreadPattern", () => {
  it.each([
    ["non-array expression", "x;", null],
    ["empty array", "[];", null],
    ["array with multiple elements", "[1, 2];", null],
    ["non-spread single element", "[1];", null]
  ])("returns %s for %s", (_, code, expected) => {
    const statement = getExpressionStatement(code);
    expect(detectSpreadPattern(statement.expression)).toEqual(expected);
  });

  it("returns the ArrayExpression for [...iter]", () => {
    const statement = getExpressionStatement("[...iter];");
    const expression = statement.expression;
    const result = detectSpreadPattern(expression);
    expect(result).not.toBeNull();
    if (result?.type === AST_NODE_TYPES.ArrayExpression) {
      // type check passed
    }
  });
});

describe("detectArrayFromWithLengthObject", () => {
  it.each([
    [true, "Array.from({ length: 5 }, (_, i) => i * 2)"],
    [false, "Array.from(iterable)"],
    [false, "other.from({ length: 5 }, fn)"],
    [false, "Array.from([1, 2], fn)"],
    [false, "Array.from({ length: 5 }, x => x)"]
  ])("returns %s for Array.from pattern", (expected, code) => {
    const { call } = findCall(code);
    const result = detectArrayFromWithLengthObject(call);
    expect(null !== result).toBe(expected);
  });
});

describe("isArraySpreadMapPattern", () => {
  it.each([
    [true, "[...Array(3)].map(x => x + 1)"],
    [false, "[x].map(fn)"],
    [false, "[...Array(3)].filter(x => x > 0)"],
    [false, "[1, 2].map(fn)"]
  ])("returns %s for pattern", (expected, code) => {
    const { call } = findCall(code);
    expect(isArraySpreadMapPattern(call)).toBe(expected);
  });
});

describe("detectAllocatePattern", () => {
  it.each([
    [true, "new Array(5).fill(0)"],
    [false, "new Array(5).fill(0, 1, 3)"],
    [false, "arr.fill(0)"],
    [false, "new Array().fill(0)"],
    [false, "new Array(5).join(',')"]
  ])("returns %s for pattern", (expected, code) => {
    const { call } = findCall(code);
    const result = detectAllocatePattern(call);
    if (expected) {
      expect(result).not.toBeNull();
      expect(result?.arrayCall.arguments.length).toBe(1);
    } else {
      expect(result).toBeNull();
    }
  });
});
