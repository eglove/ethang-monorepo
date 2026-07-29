import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findCall, linkParents, parseProgram } from "./.fixture.ts";
import {
  detectAllocatePattern,
  detectSpreadPattern,
  isArrayFromWithLengthObject,
  isArraySpreadMapPattern
} from "./prefer-effect-array-from-iterable.ts";

const getExpressionStatement = (code: string): TSESTree.ExpressionStatement => {
  const program = parseProgram(code);
  linkParents(program);
  const statement = program.body[0];
  if (!statement || AST_NODE_TYPES.ExpressionStatement !== statement.type) {
    throw new Error(`expected expression statement in: ${code}`);
  }
  return statement;
};

describe("detectSpreadPattern", () => {
  it("returns null for non-array expression", () => {
    const stmt = getExpressionStatement("x;");
    expect(detectSpreadPattern(stmt.expression)).toBeNull();
  });

  it("returns null for empty array", () => {
    const stmt = getExpressionStatement("[];");
    expect(detectSpreadPattern(stmt.expression)).toBeNull();
  });

  it("returns null for array with multiple elements", () => {
    const stmt = getExpressionStatement("[1, 2];");
    expect(detectSpreadPattern(stmt.expression)).toBeNull();
  });

  it("returns the ArrayExpression for [...iter]", () => {
    const stmt = getExpressionStatement("[...iter];");
    const expr = stmt.expression;
    const result = detectSpreadPattern(expr);
    expect(result).not.toBeNull();
    expect(result!.type).toBe(AST_NODE_TYPES.ArrayExpression);
  });

  it("returns null for non-spread single element", () => {
    const stmt = getExpressionStatement("[1];");
    expect(detectSpreadPattern(stmt.expression)).toBeNull();
  });
});

describe("isArrayFromWithLengthObject", () => {
  it("returns true for Array.from({ length: n }, callback)", () => {
    const { call } = findCall("Array.from({ length: 5 }, (_, i) => i * 2)");
    expect(isArrayFromWithLengthObject(call)).toBe(true);
  });

  it("returns false for Array.from with one argument", () => {
    const { call } = findCall("Array.from(iterable)");
    expect(isArrayFromWithLengthObject(call)).toBe(false);
  });

  it("returns false for non-Array object", () => {
    const { call } = findCall("other.from({ length: 5 }, fn)");
    expect(isArrayFromWithLengthObject(call)).toBe(false);
  });

  it("returns false when first arg is not an object", () => {
    const { call } = findCall("Array.from([1, 2], fn)");
    expect(isArrayFromWithLengthObject(call)).toBe(false);
  });

  it("returns false when callback has fewer than 2 params", () => {
    const { call } = findCall("Array.from({ length: 5 }, x => x)");
    expect(isArrayFromWithLengthObject(call)).toBe(false);
  });
});

describe("isArraySpreadMapPattern", () => {
  it("returns true for [...Array(n)].map(fn)", () => {
    const { call } = findCall("[...Array(3)].map(x => x + 1)");
    expect(isArraySpreadMapPattern(call)).toBe(true);
  });

  it("returns false for [x].map(fn)", () => {
    const { call } = findCall("[x].map(fn)");
    expect(isArraySpreadMapPattern(call)).toBe(false);
  });

  it("returns false for [...Array(n)].filter(fn)", () => {
    const { call } = findCall("[...Array(3)].filter(x => x > 0)");
    expect(isArraySpreadMapPattern(call)).toBe(false);
  });

  it("returns false for non-spread array", () => {
    const { call } = findCall("[1, 2].map(fn)");
    expect(isArraySpreadMapPattern(call)).toBe(false);
  });
});

describe("detectAllocatePattern", () => {
  it("returns the match for new Array(n).fill(v)", () => {
    const { call } = findCall("new Array(5).fill(0)");
    const result = detectAllocatePattern(call);
    expect(result).not.toBeNull();
    expect(result!.arrayCall.arguments.length).toBe(1);
  });

  it("returns null for new Array(n).fill(v, start, end)", () => {
    const { call } = findCall("new Array(5).fill(0, 1, 3)");
    expect(detectAllocatePattern(call)).toBeNull();
  });

  it("returns null for array.fill(v) without new", () => {
    const { call } = findCall("arr.fill(0)");
    expect(detectAllocatePattern(call)).toBeNull();
  });

  it("returns null for new Array() with no args", () => {
    const { call } = findCall("new Array().fill(0)");
    expect(detectAllocatePattern(call)).toBeNull();
  });

  it("returns null for non-fill method", () => {
    const { call } = findCall("new Array(5).join(',')");
    expect(detectAllocatePattern(call)).toBeNull();
  });
});
