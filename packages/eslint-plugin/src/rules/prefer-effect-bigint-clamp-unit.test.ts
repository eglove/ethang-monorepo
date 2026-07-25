import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { linkParents } from "./.fixture.ts";
import {
  detectBigIntClampPattern,
  tryMatchPattern1,
  tryMatchPattern2
} from "./prefer-effect-bigint-clamp.ts";

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
    return node.expression;
  }
  throw new Error(`no expression statement found in: ${code}`);
};

const sourceTextFor = (code: string) => {
  return code.endsWith(";") ? code : `${code};`;
};

describe("detectBigIntClampPattern", () => {
  it("detects pattern 1: x > max ? max : x < min ? min : x", () => {
    const code = "x > max ? max : x < min ? min : x";
    const expression = parseExpression(code);
    const match = detectBigIntClampPattern(expression, sourceTextFor(code));
    expect(match).not.toBeNull();
    expect(match?.value.type).toBe(AST_NODE_TYPES.Identifier);
  });

  it("detects pattern 2: x < min ? min : x > max ? max : x", () => {
    const code = "x < min ? min : x > max ? max : x";
    const expression = parseExpression(code);
    const match = detectBigIntClampPattern(expression, sourceTextFor(code));
    expect(match).not.toBeNull();
  });

  it.each([
    ["not a ternary", "x > max"],
    ["consequent doesn't match bound", "x > max ? other : x < min ? min : x"],
    [
      "inner consequent doesn't match min",
      "x > max ? max : x < min ? other : x"
    ],
    [
      "inner alternate doesn't match value",
      "x > max ? max : x < min ? min : other"
    ],
    ["simple ternary", "a ? b : c"],
    ["inner not a ternary", "x > max ? max : x < min"],
    [">= operator", "x >= max ? max : x <= min ? min : x"],
    ["reversed comparison", "max > x ? max : min > x ? min : x"]
  ])(`returns null for %s`, (_, code) => {
    const expression = parseExpression(code);
    expect(
      detectBigIntClampPattern(expression, sourceTextFor(code))
    ).toBeNull();
  });
});

describe("tryMatchPattern1", () => {
  it("matches x > max ? max : x < min ? min : x", () => {
    const code = "x > max ? max : x < min ? min : x";
    const expression = parseExpression(code);
    const ternary = expression as TSESTree.ConditionalExpression;
    const match = tryMatchPattern1(ternary, sourceTextFor(code));
    expect(match).not.toBeNull();
  });

  it.each([
    ["outer uses <", "x < max ? max : x < min ? min : x"],
    ["consequent mismatch", "x > max ? other : x < min ? min : x"],
    ["inner not conditional", "x > max ? max : x < min"],
    ["inner consequent mismatch", "x > max ? max : x < min ? other : x"],
    ["inner alternate mismatch", "x > max ? max : x < min ? min : other"],
    ["inner test wrong operator", "x > max ? max : x > min ? min : x"]
  ])(`returns null for %s`, (_, code) => {
    const expression = parseExpression(code);
    const ternary = expression as TSESTree.ConditionalExpression;
    expect(tryMatchPattern1(ternary, sourceTextFor(code))).toBeNull();
  });
});

describe("tryMatchPattern2", () => {
  it("matches x < min ? min : x > max ? max : x", () => {
    const code = "x < min ? min : x > max ? max : x";
    const expression = parseExpression(code);
    const ternary = expression as TSESTree.ConditionalExpression;
    const match = tryMatchPattern2(ternary, sourceTextFor(code));
    expect(match).not.toBeNull();
  });

  it.each([
    ["outer uses >", "x > min ? min : x > max ? max : x"],
    ["consequent mismatch", "x < min ? other : x > max ? max : x"],
    ["inner not conditional", "x < min ? min : x > max"],
    ["inner consequent mismatch", "x < min ? min : x > max ? other : x"],
    ["inner alternate mismatch", "x < min ? min : x > max ? max : other"],
    ["inner test wrong operator", "x < min ? min : x < max ? max : x"]
  ])(`returns null for %s`, (_, code) => {
    const expression = parseExpression(code);
    const ternary = expression as TSESTree.ConditionalExpression;
    expect(tryMatchPattern2(ternary, sourceTextFor(code))).toBeNull();
  });
});
