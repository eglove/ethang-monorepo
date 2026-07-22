import { describe, expect, it } from "vitest";

import { isArrayExpression, isNewExpression } from "./../utils/type-guards.ts";
import { findCall, findFirstNode, parseProgram } from "./.fixture.ts";
import {
  ARRAY_FROM_SET,
  detectUniqPattern,
  getArrayFromNewSet,
  getSetArgument,
  getSpreadOfNewSet,
  SPREAD_SET
} from "./prefer-lodash-uniq.ts";

const MATCH = "match";
const NULL = "null";
const RETURNS_FMT = "returns %s for %s";

const findArrayExpression = (code: string) => {
  const program = parseProgram(code);
  return findFirstNode(program, isArrayExpression);
};

describe("prefer-lodash-uniq", () => {
  describe("getSpreadOfNewSet", () => {
    it.each([
      [SPREAD_SET, MATCH],
      ["[...new Map(arr)]", NULL],
      ["[a, b]", NULL],
      ["[...fn()]", NULL]
    ])(RETURNS_FMT, (code, expectation) => {
      const arrayExpression = findArrayExpression(code);
      expect(arrayExpression).not.toBeNull();
      if (arrayExpression) {
        const result = getSpreadOfNewSet(arrayExpression);
        if (MATCH === expectation) {
          expect(result).not.toBeNull();
          expect(result?.arrayExpr).toBe(arrayExpression);
        } else {
          expect(result).toBeNull();
        }
      }
    });
  });

  describe("getArrayFromNewSet", () => {
    it.each([
      [ARRAY_FROM_SET, MATCH],
      ["Array.from(arr)", NULL],
      ["Array.from(new Map(arr))", NULL],
      ["Array.from(new a.b())", NULL],
      ["Array.from()", NULL],
      ["Array.from(new Set(arr), mapper)", NULL],
      ['Array["from"](new Set(arr))', NULL],
      ["Array.of(new Set(arr))", NULL]
    ])(RETURNS_FMT, (code, expectation) => {
      const { call } = findCall(code);
      const result = getArrayFromNewSet(call);
      if (MATCH === expectation) {
        expect(result).not.toBeNull();
        expect(result?.callExpr).toBe(call);
      } else {
        expect(result).toBeNull();
      }
    });
  });

  describe("getSetArgument", () => {
    it.each([
      [ARRAY_FROM_SET, MATCH],
      ["Array.from(new Set())", NULL],
      ["Array.from(new Set(...arr))", NULL]
    ])(RETURNS_FMT, (code, expectation) => {
      const { call } = findCall(code);
      const [newSetNode] = call.arguments;
      if (newSetNode && isNewExpression(newSetNode)) {
        const inner = getSetArgument(newSetNode);
        if (NULL === expectation) {
          expect(inner).toBeNull();
        } else {
          expect(inner).not.toBeNull();
        }
      }
    });
  });

  describe("detectUniqPattern", () => {
    it.each([
      [SPREAD_SET, "spread-set"],
      [ARRAY_FROM_SET, "array-from-set"],
      ["[1, 2, 3]", null],
      ["[...new Map(arr)]", null],
      ["Array.from(arr)", null],
      ["Array.from(new Set())", null],
      ["[...new Set(...arr)]", null],
      ["Array.from(new Set(...arr))", null]
    ])("classifies %s as %s", (code, expectedKind) => {
      if (code.startsWith("Array.from")) {
        const { call } = findCall(code);
        const match = detectUniqPattern(call);
        expect(match?.kind ?? null).toBe(expectedKind);
      } else {
        const arrayExpression = findArrayExpression(code);
        expect(arrayExpression).not.toBeNull();
        if (arrayExpression) {
          const match = detectUniqPattern(arrayExpression);
          expect(match?.kind ?? null).toBe(expectedKind);
        }
      }
    });
  });
});
