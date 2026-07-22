import type { TSESTree } from "@typescript-eslint/utils";

import isNil from "lodash/isNil.js";
import { describe, expect, it } from "vitest";

import { isIdentifier, isMemberExpression } from "./../utils/type-guards.ts";
import {
  expressionStatement,
  findCall,
  findIdentifier,
  firstExpression,
  linkParents,
  parseProgram
} from "./.fixture.ts";
import {
  detectIntersectionPattern,
  getExpressionBody,
  getFilterCallTarget,
  getFirstArrowCallbackArgument,
  getFirstIdentifierArgument,
  getSingleIdentifierArrowParameter,
  isFilterCall,
  isIncludesCallWithParameter
} from "./prefer-lodash-intersection.ts";

const PARAM_NAME = "x";
const EACH_TITLE = "returns %s for %s";

const arrowExpression = (code: string) => {
  const program = parseProgram(code);
  linkParents(program);
  const statement = expressionStatement(code);
  return statement.expression as TSESTree.ArrowFunctionExpression;
};

const firstStatementExpression = (code: string) => {
  const program = parseProgram(code);
  linkParents(program);
  return firstExpression(code) as TSESTree.CallExpression;
};

const isIdentifierName = (
  value: null | TSESTree.Identifier | undefined,
  expected: null | string
) => {
  return expected === (value?.name ?? null);
};

const FILTER_CALL_CASES = [
  ["arr.filter(x => x > 0)", true],
  ["arr.map(x => x > 0)", false],
  ["arr[filter](x => x > 0)", false],
  ["arr['filter'](x => x > 0)", false]
] as const;

describe("isFilterCall", () => {
  it.each(FILTER_CALL_CASES)(EACH_TITLE, (code, expected) => {
    expect(isFilterCall(firstStatementExpression(`${code};`))).toBe(expected);
  });
  it("returns false for a bare identifier", () => {
    expect(isFilterCall(findIdentifier("arr.filter;"))).toBe(false);
  });
  it("returns false for a private property", () => {
    const { call } = findCall(
      "class Values { #filter() {} run() { this.#filter(); } }"
    );
    expect(isFilterCall(call)).toBe(false);
  });
});

describe("getFilterCallTarget", () => {
  it("returns the member callee for canonical filter calls", () => {
    const { call } = findCall("arr.filter((value) => value);");
    const target = getFilterCallTarget(call);
    if (
      !target ||
      !isMemberExpression(target) ||
      !isIdentifier(target.property)
    ) {
      throw new Error("expected MemberExpression with Identifier property");
    }
    expect(target.property.name).toBe("filter");
  });

  it("returns null for computed filter calls", () => {
    const { call } = findCall("arr['filter']((value) => value);");
    expect(getFilterCallTarget(call)).toBeNull();
  });

  it("returns null for non-filter calls", () => {
    const { call } = findCall("arr.map((value) => value);");
    expect(getFilterCallTarget(call)).toBeNull();
  });
});

const INCLUDES_PARAM_CASES = [
  ["arr2.includes(x)", true],
  ["arr2.includes(y)", false],
  ["arr2.has(x)", false],
  ["arr2[x]", false],
  ["arr2.includes(x, 1)", false],
  ["arr2['includes'](x)", false]
] as const;

describe("isIncludesCallWithParameter", () => {
  it.each(INCLUDES_PARAM_CASES)(EACH_TITLE, (code, expected) => {
    const expression = firstExpression(`${code};`);
    expect(isIncludesCallWithParameter(expression, PARAM_NAME)).toBe(expected);
  });
});

const SINGLE_ID_ARROW_CASES = [
  ["(x) => x", "x"],
  ["(x, y) => x", null],
  ["({x}) => x", null]
] as const;

describe("getSingleIdentifierArrowParameter", () => {
  it.each(SINGLE_ID_ARROW_CASES)(EACH_TITLE, (code, expectedName) => {
    const arrow = arrowExpression(`${code};`);
    expect(
      isIdentifierName(getSingleIdentifierArrowParameter(arrow), expectedName)
    ).toBe(true);
  });
});

describe("getExpressionBody", () => {
  it.each([
    ["x => x", true],
    ["x => { return x; }", false]
  ])("returns expression for %s", (code, expectedPresent) => {
    const arrow = arrowExpression(`${code};`);
    expect(!isNil(getExpressionBody(arrow))).toBe(expectedPresent);
  });
});

describe("getFirstIdentifierArgument", () => {
  it.each([
    ["fn(obj)", "obj"],
    ["fn()", null],
    ["fn(1)", null]
  ])(EACH_TITLE, (code, expectedName) => {
    const { call } = findCall(code);
    expect(
      isIdentifierName(getFirstIdentifierArgument(call), expectedName)
    ).toBe(true);
  });
});

describe("getFirstArrowCallbackArgument", () => {
  it.each([
    ["fn(x => x)", true],
    ["fn(1)", false]
  ])("returns arrow for %s", (code, expectedPresent) => {
    const { call } = findCall(code);
    expect(!isNil(getFirstArrowCallbackArgument(call))).toBe(expectedPresent);
  });
});

const DETECT_CASES = [
  ["arr.map(x => x);", false],
  ["filter(x => x);", false],
  ["arr.filter(x => x > 0);", false],
  ["arr.filter(x => arr2.includes(x));", true],
  ["arr.filter();", false],
  ["arr.filter((x, i) => arr2.includes(x));", false],
  ["arr.filter(x => { return arr2.includes(x); });", false],
  ["arr.filter(x => x.startsWith('a'));", false],
  ["arr.filter(x => arr2.includes(y));", false],
  ["arr.filter(x => !arr2.includes(x));", false]
] as const;

describe("detectIntersectionPattern", () => {
  it("returns null for computed filter access", () => {
    const { call } = findCall("arr['filter']((x) => arr2.includes(x));");
    expect(detectIntersectionPattern(call)).toBeNull();
  });

  it.each(DETECT_CASES)(EACH_TITLE, (code, expectedDetected) => {
    const { call } = findCall(code);
    expect(!isNil(detectIntersectionPattern(call))).toBe(expectedDetected);
  });

  it("detects the pattern with chained receiver", () => {
    const { call } = findCall("items.map(fn).filter(x => arr2.includes(x));");
    expect(detectIntersectionPattern(call)).not.toBeNull();
  });
});
