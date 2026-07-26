import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findArrowFunction, findCall, linkParents } from "./.fixture.ts";
import {
  detectInterspersePattern,
  isFlatMapCall,
  validateIntersperseCallback
} from "./prefer-effect-array-intersperse.ts";

const parseExpression = (code: string) => {
  const source = code.endsWith(";") ? code : `${code};`;
  const program = parseForESLint(source, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;
  linkParents(program);
  for (const node of program.body) {
    if (AST_NODE_TYPES.ExpressionStatement !== node.type) {
      continue;
    }
    return { expression: node.expression, source };
  }
  throw new Error(`no expression statement found in: ${code}`);
};

describe("isFlatMapCall", () => {
  it("returns true for .flatMap() calls", () => {
    const { call } = findCall("arr.flatMap(fn);");
    expect(isFlatMapCall(call)).toBe(true);
  });

  it.each([
    [".map() calls", "arr.map(fn);"],
    [".filter() calls", "arr.filter(fn);"],
    [".reduce() calls", "arr.reduce(fn, init);"],
    ["non-call", "arr.flatMap;"],
    ["computed property flatMap call", "arr['flatMap'](fn);"]
  ])(`rejects %s`, (_, code) => {
    const { expression } = parseExpression(code);
    expect(isFlatMapCall(expression)).toBe(false);
  });
});

describe("validateIntersperseCallback", () => {
  it.each([
    ["canonical pattern", "arr.flatMap((x, i) => i === 0 ? [x] : [sep, x]);"],
    [
      "with block body and return",
      "arr.flatMap((x, i) => { return i === 0 ? [x] : [sep, x]; });"
    ],
    [
      "with three params",
      "arr.flatMap((x, i, a) => i === 0 ? [x] : [sep, x]);"
    ],
    [
      "different var names",
      "items.flatMap((item, index) => index === 0 ? [item] : [separator, item]);"
    ],
    ["complex separator", "arr.flatMap((x, i) => i === 0 ? [x] : [', ', x]);"]
  ])(`detects %s`, (_, code) => {
    const arrow = findArrowFunction(code);
    const result = validateIntersperseCallback(arrow);
    expect(result).not.toBeNull();
    expect(result?.elementName).toBe(
      "x" === /flatMap\(\((\w+)/u.exec(code)?.[1]
        ? /flatMap\(\((\w+)/u.exec(code)?.[1]
        : "item"
    );
  });

  it.each([
    ["no index param", "arr.flatMap(x => [x]);"],
    ["i !== 0", "arr.flatMap((x, i) => i !== 0 ? [x] : [sep, x]);"],
    ["i > 0", "arr.flatMap((x, i) => i > 0 ? [x] : [sep, x]);"],
    ["0 === i (reversed)", "arr.flatMap((x, i) => 0 === i ? [x] : [sep, x]);"],
    ["i === 1", "arr.flatMap((x, i) => i === 1 ? [x] : [sep, x]);"],
    [
      "consequent not [x]",
      "arr.flatMap((x, i) => i === 0 ? [transform(x)] : [sep, x]);"
    ],
    [
      "alternate not [sep, x]",
      "arr.flatMap((x, i) => i === 0 ? [x] : [sep, transform(x)]);"
    ],
    [
      "consequent 2 elements",
      "arr.flatMap((x, i) => i === 0 ? [x, extra] : [sep, x]);"
    ],
    [
      "alternate 3 elements",
      "arr.flatMap((x, i) => i === 0 ? [x] : [sep, x, extra]);"
    ],
    [
      "consequent spread",
      "arr.flatMap((x, i) => i === 0 ? [...x] : [sep, x]);"
    ],
    ["alternate spread", "arr.flatMap((x, i) => i === 0 ? [x] : [...sep, x]);"],
    [
      "multiple statements",
      "arr.flatMap((x, i) => { const y = i === 0; return y ? [x] : [sep, x]; });"
    ],
    ["non-ternary body", "arr.flatMap((x, i) => [x, i]);"],
    ["consequent hole", "arr.flatMap((x, i) => i === 0 ? [,] : [sep, x]);"],
    ["alternate hole", "arr.flatMap((x, i) => i === 0 ? [x] : [,]);"],
    ["alternate second hole", "arr.flatMap((x, i) => i === 0 ? [x] : [sep,]);"],
    [
      "alternate value mismatch",
      "arr.flatMap((x, i) => i === 0 ? [x] : [sep, y]);"
    ],
    [
      "destructured element param",
      "arr.flatMap(([head, ...rest], i) => i === 0 ? [[head, ...rest]] : [sep, [head, ...rest]]);"
    ],
    [
      "destructured index param",
      "arr.flatMap((x, [a]) => a === 0 ? [x] : [sep, x]);"
    ]
  ])(`returns null for %s`, (_, code) => {
    const arrow = findArrowFunction(code);
    expect(validateIntersperseCallback(arrow)).toBeNull();
  });
});

describe("detectInterspersePattern", () => {
  it("detects the canonical pattern", () => {
    const { call } = findCall(
      "arr.flatMap((x, i) => i === 0 ? [x] : [sep, x]);"
    );
    const match = detectInterspersePattern(call);
    expect(match).not.toBeNull();
    expect(match?.elementName).toBe("x");
    expect(match?.receiver.type).toBe(AST_NODE_TYPES.Identifier);
  });

  it.each([
    ["not a flatMap call", "arr.map((x, i) => i === 0 ? [x] : [sep, x]);"],
    ["flatMap with only one param", "arr.flatMap(x => [x]);"],
    ["non-call node", "arr;"],
    ["no callback", "arr.flatMap();"],
    ["callback is identifier", "arr.flatMap(someFn);"],
    ["computed property", 'arr["flatMap"]((x, i) => i === 0 ? [x] : [sep, x]);']
  ])(`returns null for %s`, (_, code) => {
    const { expression } = parseExpression(code);
    expect(detectInterspersePattern(expression)).toBeNull();
  });
});
