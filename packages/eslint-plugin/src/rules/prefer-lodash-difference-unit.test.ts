import type { TSESTree } from "@typescript-eslint/utils";

import isNil from "lodash/isNil.js";
import { describe, expect, it } from "vitest";

import { isMemberExpression } from "./../utils/type-guards.ts";
import {
  expressionStatement,
  findCall,
  firstExpression,
  linkParents,
  parseProgram
} from "./.fixture.ts";
import {
  detectDifferencePattern,
  getExpressionBody,
  getFilterCallTarget,
  getFirstArrowCallbackArgument,
  getFirstIdentifierArgument,
  getSingleIdentifierArrowParameter,
  isFilterCall,
  isNegatedIncludesCallWithParameter
} from "./prefer-lodash-difference.ts";

const PARAM_NAME = "x";
const EACH_TITLE = "returns %s for %s";

const arrowExpression = (code: string) => {
  const program = parseProgram(code);
  linkParents(program);
  const statement = expressionStatement(code);
  return statement.expression as TSESTree.ArrowFunctionExpression;
};

describe("isFilterCall", () => {
  it.each([
    [true, "arr.filter(x => arr2.includes(x))"],
    [true, "arr.filter(x => !arr2.includes(x))"],
    [false, "arr.map(x => x)"],
    [false, "arr['filter'](x => x)"]
  ])(EACH_TITLE, (expected, code) => {
    const { call } = findCall(code);
    expect(isFilterCall(call)).toBe(expected);
  });
});

describe("isNegatedIncludesCallWithParameter", () => {
  it.each([
    [true, "!arr2.includes(x)"],
    [true, "!(arr2.includes(x))"],
    [false, "arr2.includes(x)"],
    [false, "!arr2.has(x)"],
    [false, "arr2.includes(y)"],
    [false, "!arr2.includes(x, 1)"],
    [false, "!x.includes(y)"],
    [false, "~arr2.includes(x)"]
  ])(EACH_TITLE, (expected, code) => {
    const expression = firstExpression(`${code};`);
    expect(isNegatedIncludesCallWithParameter(expression, PARAM_NAME)).toBe(
      expected
    );
  });
});

describe("detectDifferencePattern", () => {
  it.each([
    [true, "arr.filter((x) => !arr2.includes(x))"],
    [false, "arr.filter((x) => arr2.includes(x))"],
    [false, "arr.filter((x) => !arr2.has(x))"],
    [false, "arr['filter']((x) => !arr2.includes(x))"],
    [false, "arr.filter((x) => !arr2.includes(x, 1))"],
    [false, "arr.filter((x) => !x.includes(arr2))"],
    [false, "arr.filter(function (x) { return !arr2.includes(x); })"],
    [false, "arr.filter((x, i) => !arr2.includes(x))"],
    [false, "arr.filter((x) => !getArr().includes(x))"]
  ])(EACH_TITLE, (expected, code) => {
    const { call } = findCall(`${code};`);
    const result = detectDifferencePattern(call);
    if (expected) {
      expect(result).not.toBeNull();
    } else {
      expect(result).toBeNull();
    }
  });
});

describe("getFilterCallTarget", () => {
  it("returns the member callee for canonical filter calls", () => {
    const { call } = findCall("arr.filter((value) => value);");
    const target = getFilterCallTarget(call);
    if (!target || !isMemberExpression(target)) {
      throw new Error("expected MemberExpression");
    }
    expect(target.type).toBe("MemberExpression");
  });

  it("returns null for computed filter calls", () => {
    const { call } = findCall("arr['filter']((value) => value);");
    expect(getFilterCallTarget(call)).toBeNull();
  });
});

describe("getFirstIdentifierArgument", () => {
  it.each([
    [true, "fn(a, b)"],
    [false, "fn()"],
    [false, "fn(1)"]
  ])(EACH_TITLE, (expected, code) => {
    const { call } = findCall(code);
    const result = getFirstIdentifierArgument(call);
    expect(isNil(result)).toBe(!expected);
  });
});

describe("getFirstArrowCallbackArgument", () => {
  it.each([
    [true, "fn(() => x)"],
    [false, "fn(x)"],
    [false, "fn(function () { return x; })"]
  ])(EACH_TITLE, (expected, code) => {
    const { call } = findCall(code);
    const result = getFirstArrowCallbackArgument(call);
    expect(isNil(result)).toBe(!expected);
  });
});

describe("getSingleIdentifierArrowParameter", () => {
  it.each([
    [true, "(x) => x"],
    [true, "x => x"],
    [false, "() => x"],
    [false, "(x, y) => x"],
    [false, "({ x }) => x"]
  ])(EACH_TITLE, (expected, code) => {
    const arrow = arrowExpression(`${code};`);
    const result = getSingleIdentifierArrowParameter(arrow);
    expect(isNil(result)).toBe(!expected);
  });
});

describe("getExpressionBody", () => {
  it.each([
    [true, "(x) => x + 1"],
    [false, "(x) => { return x + 1; }"]
  ])(EACH_TITLE, (expected, code) => {
    const arrow = arrowExpression(`${code};`);
    const result = getExpressionBody(arrow);
    expect(isNil(result)).toBe(!expected);
  });
});
