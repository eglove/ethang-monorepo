import type { TSESTree } from "@typescript-eslint/utils";

import { describe, expect, it } from "vitest";

import {
  expressionStatement,
  findBinary,
  findIdentifier,
  findMember
} from "../rules/.fixture.ts";
import {
  getIsEmptyReceiver,
  getObjectKeysArgument,
  isLengthEqualsZero,
  isLengthMemberAccess,
  isObjectKeysLengthEqualsZero,
  isValidIsEmptyReceiver,
  shouldPreferIsEmpty
} from "./prefer-patterns-shape.ts";

const ARR_LENGTH_EQ_0 = "arr.length === 0;";
const OBJECT_KEYS_ARR_LENGTH_0 = "Object.keys(arr).length === 0;";
const ARR_LENGTH_EQ_1 = "arr.length === 1;";
const EACH_TITLE = "returns $expected for $code";

describe("isLengthMemberAccess", () => {
  it.each([
    { code: "arr.length;", expected: true },
    { code: "arr['length'];", expected: false },
    { code: "arr.size;", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const member = findMember(code);
    expect(isLengthMemberAccess(member)).toBe(expected);
  });
});

describe("isValidIsEmptyReceiver", () => {
  it.each([
    { code: "arr;", expected: true },
    { code: "a.b;", expected: true },
    { code: "undefined;", expected: false },
    { code: "1;", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const expression = code.startsWith("1;")
      ? expressionStatement(code).expression
      : findIdentifier(code);
    expect(isValidIsEmptyReceiver(expression)).toBe(expected);
  });
});

describe("isLengthEqualsZero", () => {
  it.each([
    { code: ARR_LENGTH_EQ_0, expected: true },
    { code: "0 === arr.length;", expected: true },
    { code: ARR_LENGTH_EQ_1, expected: false },
    { code: "arr.length != 0;", expected: true },
    { code: "arr.size === 0;", expected: false },
    { code: "undefined.length === 0;", expected: false },
    { code: "arr.length !== 0;", expected: true }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { binary } = findBinary(code);
    expect(isLengthEqualsZero(binary)).toBe(expected);
  });
});

describe("getObjectKeysArgument", () => {
  it("returns undefined when Object.keys is called without an argument", () => {
    const innerCall = findMember("Object.keys().length;")
      .object as TSESTree.CallExpression;
    expect(getObjectKeysArgument(innerCall)).toBeUndefined();
  });

  it("returns null for computed Object['keys'] access", () => {
    const innerCall = findMember("Object['keys']().length;")
      .object as TSESTree.CallExpression;
    expect(getObjectKeysArgument(innerCall)).toBeNull();
  });
});

describe("isObjectKeysLengthEqualsZero", () => {
  it.each([
    { code: OBJECT_KEYS_ARR_LENGTH_0, expected: true },
    { code: "Object.keys(arr).length === 1;", expected: false },
    { code: "Object.keys(arr).size === 0;", expected: false },
    { code: ARR_LENGTH_EQ_0, expected: false },
    { code: "Object.values(arr).length === 0;", expected: false },
    { code: "Other.keys(arr).length === 0;", expected: false },
    { code: "Object.keys(undefined).length === 0;", expected: false },
    { code: "0 === Object.keys(arr).length;", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { binary } = findBinary(code);
    expect(isObjectKeysLengthEqualsZero(binary)).toBe(expected);
  });
});

describe("shouldPreferIsEmpty", () => {
  it.each([
    { code: ARR_LENGTH_EQ_0, expected: true },
    { code: OBJECT_KEYS_ARR_LENGTH_0, expected: true },
    { code: ARR_LENGTH_EQ_1, expected: false },
    { code: "arr.length < 0;", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { binary } = findBinary(code);
    expect(shouldPreferIsEmpty(binary)).toBe(expected);
  });
});

describe("getIsEmptyReceiver", () => {
  it("arr.length === 0", () => {
    const { binary } = findBinary(ARR_LENGTH_EQ_0);
    const receiver = getIsEmptyReceiver(binary);
    expect((receiver as TSESTree.Identifier).name).toBe("arr");
  });
  it("0 === arr.length", () => {
    const { binary } = findBinary("0 === arr.length;");
    const receiver = getIsEmptyReceiver(binary);
    expect((receiver as TSESTree.Identifier).name).toBe("arr");
  });
  it("Object.keys(arr).length === 0", () => {
    const { binary } = findBinary(OBJECT_KEYS_ARR_LENGTH_0);
    const receiver = getIsEmptyReceiver(binary);
    expect((receiver as TSESTree.Identifier).name).toBe("arr");
  });
  it("returns null for reversed Object.keys comparison", () => {
    const { binary } = findBinary("0 === Object.keys(arr).length;");
    expect(getIsEmptyReceiver(binary)).toBeNull();
  });
  it("returns null when neither side keeps the canonical receiver shape", () => {
    const { binary } = findBinary("0 === 0;");
    expect(getIsEmptyReceiver(binary)).toBeNull();
  });
  it("non-matching", () => {
    const { binary } = findBinary(ARR_LENGTH_EQ_1);
    expect(getIsEmptyReceiver(binary)).toBeNull();
  });
});
