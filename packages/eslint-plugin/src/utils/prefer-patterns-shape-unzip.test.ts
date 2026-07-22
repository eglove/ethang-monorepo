import type { TSESTree } from "@typescript-eslint/utils";

import { describe, expect, it } from "vitest";

import {
  findBinary,
  findCall,
  findMember,
  findNew
} from "../rules/.fixture.ts";
import {
  getIndexedByParameter,
  getOneParameterArrow,
  getUnzipIndexName,
  getUnzipInnerArrayName,
  getUnzipOuterIndex,
  getZeroIndexedReceiver,
  isMapMethod,
  isMatchingIndexedAccess,
  isUnzipStyleOuter,
  isValidUniqArgument,
  isZeroLiteral,
  shouldPreferUniq,
  shouldPreferUnzip,
  shouldPreferZip
} from "./prefer-patterns-shape.ts";

const FOO_ARR = "foo(arr);";
const UNZIP_CANONICAL = "arr[0].map((_, i) => arr.map((r) => r[i]));";
const UNZIP_ARROW_BODY_1 = "arr[0].map((_, i) => 1);";
const EACH_TITLE = "returns $expected for $code";

describe("isZeroLiteral", () => {
  it.each([
    { code: "x === 0;", expected: true },
    { code: "x === 1;", expected: false },
    { code: "x === y;", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { binary } = findBinary(code);
    expect(isZeroLiteral(binary.right)).toBe(expected);
  });
});

describe("isValidUniqArgument", () => {
  it("rejects an absent argument", () => {
    expect(isValidUniqArgument(null)).toBe(false);
  });

  it.each([
    { code: FOO_ARR, expected: true },
    { code: "foo(a.b);", expected: true },
    { code: "foo(getArray());", expected: true },
    { code: "foo(123);", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { call } = findCall(code);
    expect(isValidUniqArgument(call.arguments[0])).toBe(expected);
  });
});

describe("shouldPreferUniq", () => {
  it.each([
    { code: "const x = [...new Set(arr)];", expected: true },
    { code: "const x = [...new Set()];", expected: false },
    { code: "const x = [...new Set(arr1, arr2)];", expected: false },
    { code: "const x = [...new Map(arr)];", expected: false },
    { code: "const x = new Set(arr);", expected: false },
    { code: "const x = [...new Set(123)];", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    expect(shouldPreferUniq(findNew(code).newExpr)).toBe(expected);
  });
});

describe("isMapMethod", () => {
  it.each([
    { code: "xs.map(fn);", expected: true },
    { code: "xs.filter(fn);", expected: false },
    { code: "map(xs, fn);", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { call } = findCall(code);
    expect(isMapMethod(call)).toBe(expected);
  });
});

describe("getZeroIndexedReceiver", () => {
  it.each([
    { arrayName: "arr", code: "arr[0].map(fn);", null: false },
    { arrayName: null, code: "arr[1].map(fn);", null: true },
    { arrayName: null, code: "arr.length.toString();", null: true },
    { arrayName: null, code: "getArr()[0].map(fn);", null: true },
    { arrayName: null, code: "map(fn);", null: true }
  ])("returns $arrayName for $code", ({ code, null: isNull }) => {
    const { call } = findCall(code);
    const result = getZeroIndexedReceiver(call);
    if (isNull) {
      expect(result).toBeNull();
    } else {
      expect(result?.arrayName).toBe("arr");
    }
  });
});

describe("getOneParameterArrow", () => {
  it.each([
    { code: "arr.map(() => 1);", isNull: true, shouldMatch: false },
    { code: "arr.map((a) => a);", isNull: false, shouldMatch: true },
    { code: "arr[0].map((a, b) => a);", isNull: true, shouldMatch: false }
  ])("returns expected for $code", ({ code, isNull }) => {
    const { call } = findCall(code);
    const result = getOneParameterArrow(call.arguments[0]);
    if (isNull) {
      expect(result).toBeNull();
    } else {
      expect(result).not.toBeNull();
    }
  });
  it("null input", () => {
    expect(getOneParameterArrow(null)).toBeNull();
  });
});

describe("isMatchingIndexedAccess / getIndexedByParameter", () => {
  it.each([
    { code: "row[i];", expected: true },
    { code: "row.i;", expected: false },
    { code: "other[i];", expected: false }
  ])(
    "isMatchingIndexedAccess returns $expected for $code",
    ({ code, expected }) => {
      const member = findMember(code);
      expect(isMatchingIndexedAccess(member, "row")).toBe(expected);
    }
  );
  it("non-member", () => {
    const { call } = findCall("fn();");
    expect(isMatchingIndexedAccess(call as never, "row")).toBe(false);
  });
  it("getIndexedByParameter returns member when matched", () => {
    const member = findMember("row[i];");
    expect(getIndexedByParameter(member, "row")?.propertyName).toBe("i");
  });
  it("getUnzipIndexName returns null for null", () => {
    expect(getUnzipIndexName(null, "arr", "i")).toBeNull();
  });
});

describe("isUnzipStyleOuter", () => {
  const cases: { code: string; expected: boolean }[] = [
    { code: UNZIP_CANONICAL, expected: true },
    {
      code: "arr[0].filter((_, i) => arr.map((r) => r[i]));",
      expected: false
    },
    { code: "arr[1].map((_, i) => arr.map((r) => r[i]));", expected: false },
    { code: "foo();", expected: false },
    { code: "arr[0].map((i) => arr.map((r) => r[i]));", expected: false },
    { code: "arr[0].map((_, {x}) => 1);", expected: false },
    { code: UNZIP_ARROW_BODY_1, expected: false },
    { code: "arr[0].map((_, i) => arr.filter((r) => r[i]));", expected: false },
    {
      code: "arr[0].map((_, i) => other.map((r) => r[i]));",
      expected: false
    },
    { code: "arr[0].map((_, i) => arr.map(() => 1));", expected: false },
    { code: "arr[0].map((_, i) => arr.map(({x}) => x[i]));", expected: false },
    { code: "arr[0].map((_, i) => arr.map((r) => r.x));", expected: false }
  ];
  it.each(cases)("returns $expected for $code", ({ code, expected }) => {
    const { call } = findCall(code);
    expect(isUnzipStyleOuter(call)).toBe(expected);
  });
});

describe("shouldPreferUnzip / shouldPreferZip", () => {
  it("unzip canonical", () => {
    const { call } = findCall(UNZIP_CANONICAL);
    expect(shouldPreferUnzip(call)).toBe(true);
  });
  it("zip canonical (same shape)", () => {
    const { call } = findCall(UNZIP_CANONICAL);
    expect(shouldPreferZip(call)).toBe(true);
  });
  it("unzip non-matching", () => {
    const { call } = findCall(UNZIP_ARROW_BODY_1);
    expect(shouldPreferUnzip(call)).toBe(false);
  });
  it("zip non-matching", () => {
    const { call } = findCall(UNZIP_ARROW_BODY_1);
    expect(shouldPreferZip(call)).toBe(false);
  });
});

describe("getUnzipInnerArrayName / getUnzipOuterIndex", () => {
  it("inner array name", () => {
    const { call } = findCall("arr.map((r) => r[i]);");
    expect(getUnzipInnerArrayName(call)).toBe("arr");
  });
  it("non-member inner", () => {
    const { call } = findCall("foo(r);");
    expect(getUnzipInnerArrayName(call)).toBeNull();
  });
  it("outer index from 2-param arrow", () => {
    const { call } = findCall(UNZIP_ARROW_BODY_1);
    const arrow = call.arguments[0] as TSESTree.ArrowFunctionExpression;
    expect(getUnzipOuterIndex(arrow)).toBe("i");
  });
  it("outer non-id second param", () => {
    const { call } = findCall("arr[0].map((_, {x}) => 1);");
    const arrow = call.arguments[0] as TSESTree.ArrowFunctionExpression;
    expect(getUnzipOuterIndex(arrow)).toBeNull();
  });
});
