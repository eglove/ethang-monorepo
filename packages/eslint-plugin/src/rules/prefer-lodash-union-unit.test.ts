import type { TSESTree } from "@typescript-eslint/utils";

import isNil from "lodash/isNil.js";
import { describe, expect, it } from "vitest";

import { firstExpression } from "./.fixture.ts";
import {
  detectUnionPattern,
  extractSpreadArrays,
  getSpreadArgument,
  isNewSetCall
} from "./prefer-lodash-union.ts";

describe("getSpreadArgument", () => {
  it("returns the argument for a spread element", () => {
    const expression = firstExpression("[...arr];") as TSESTree.ArrayExpression;
    const [element] = expression.elements;
    const argument = isNil(element) ? null : getSpreadArgument(element);
    expect(argument).not.toBeNull();
  });

  it("returns null for non-spread elements", () => {
    const expression = firstExpression("[arr];") as TSESTree.ArrayExpression;
    const [element] = expression.elements;
    const argument = isNil(element) ? null : getSpreadArgument(element);
    expect(argument).toBeNull();
  });
});

describe("isNewSetCall", () => {
  it("returns true for new Set()", () => {
    const expression = firstExpression("new Set();");
    expect(isNewSetCall(expression)).toBe(true);
  });

  it("returns true for new Set(arr)", () => {
    const expression = firstExpression("new Set(arr);");
    expect(isNewSetCall(expression)).toBe(true);
  });

  it.each([
    { code: "new Map();", label: "new Map()" },
    { code: "Set();", label: "Set()" },
    { code: "new obj.Set();", label: "new obj.Set()" }
  ])("returns false for $label", ({ code }) => {
    const expression = firstExpression(code);
    expect(isNewSetCall(expression)).toBe(false);
  });
});

describe("extractSpreadArrays", () => {
  it("extracts spread arguments from array", () => {
    const expression = firstExpression(
      "[...a, ...b];"
    ) as TSESTree.ArrayExpression;
    const arrays = extractSpreadArrays(expression);
    expect(arrays).not.toBeNull();
    expect(arrays?.length).toBe(2);
  });

  it("returns null for non-spread elements", () => {
    const expression = firstExpression("[a, b];") as TSESTree.ArrayExpression;
    const arrays = extractSpreadArrays(expression);
    expect(arrays).toBeNull();
  });

  it("returns null for mixed elements", () => {
    const expression = firstExpression(
      "[...a, b];"
    ) as TSESTree.ArrayExpression;
    const arrays = extractSpreadArrays(expression);
    expect(arrays).toBeNull();
  });

  it("skips null holes in array", () => {
    const expression = firstExpression("[, ...a];") as TSESTree.ArrayExpression;
    const arrays = extractSpreadArrays(expression);
    expect(arrays).not.toBeNull();
    expect(arrays?.length).toBe(1);
  });
});

describe("detectUnionPattern", () => {
  it("detects basic union pattern", () => {
    const expression = firstExpression("[...new Set([...a, ...b])];");
    const match = detectUnionPattern(expression);
    expect(match).not.toBeNull();
    expect(match?.arrays.length).toBe(2);
  });

  it("detects union with 3 arrays", () => {
    const expression = firstExpression("[...new Set([...a, ...b, ...c])];");
    const match = detectUnionPattern(expression);
    expect(match).not.toBeNull();
    expect(match?.arrays.length).toBe(3);
  });

  it("detects union with member expressions", () => {
    const expression = firstExpression("[...new Set([...obj.a, ...obj.b])];");
    const match = detectUnionPattern(expression);
    expect(match).not.toBeNull();
  });

  it.each([
    { code: "arr;", label: "non-array" },
    { code: "[a, b];", label: "plain array" },
    { code: "[...arr];", label: "array without Set" },
    { code: "[...new Set([a, b])];", label: "Set with non-spread elements" },
    { code: "[...new Set()];", label: "Set with no arguments" },
    { code: "[new Set([...a])];", label: "outer element is not a spread" },
    { code: "[...new Set(arr)];", label: "Set argument is not an array" },
    { code: "[...new Set([])];", label: "inner array has no spreads" },
    { code: "[...new Map([[a, b]])];", label: "new Map instead of Set" },
    { code: "[...new Set([...a]), ...b];", label: "multiple outer elements" },
    { code: "[,];", label: "outer array has a hole as only element" },
    { code: "[...new Set([,])];", label: "Set has an argument that is a hole" }
  ])("returns null for $label", ({ code }) => {
    const expression = firstExpression(code);
    const match = detectUnionPattern(expression);
    expect(match).toBeNull();
  });
});
