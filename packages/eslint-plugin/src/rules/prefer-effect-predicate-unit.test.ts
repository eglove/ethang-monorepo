import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  getStringLiteral,
  getTypeofLiteral
} from "./prefer-effect-predicate.ts";

const parseExpression = (code: string) => {
  const program = parseForESLint(`${code};`, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;
  for (const node of program.body) {
    if (AST_NODE_TYPES.ExpressionStatement === node.type) {
      return node.expression;
    }
  }
  throw new Error(`no expression statement found in: ${code}`);
};

const parseBinaryExpression = (code: string) => {
  const program = parseForESLint(`${code};`, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;
  for (const node of program.body) {
    if (AST_NODE_TYPES.ExpressionStatement !== node.type) {
      continue;
    }
    const { expression } = node;
    if (AST_NODE_TYPES.BinaryExpression === expression.type) {
      return expression;
    }
  }
  throw new Error(`no binary expression found in: ${code}`);
};

describe("getStringLiteral", () => {
  it("returns the string value for a string literal expression", () => {
    expect(getStringLiteral(parseExpression("'bigint'"))).toBe("bigint");
  });

  it.each([
    { code: "1", label: "numeric literal" },
    { code: "true", label: "boolean literal" },
    { code: "x", label: "identifier" },
    { code: "[]", label: "array literal" }
  ])("returns null for $code ($label)", ({ code }) => {
    expect(getStringLiteral(parseExpression(code))).toBeNull();
  });
});

describe("getTypeofLiteral", () => {
  it.each([
    { code: "typeof x === 'bigint'", expected: "bigint" },
    { code: "typeof x !== 'bigint'", expected: "bigint" },
    { code: "typeof x === 'symbol'", expected: "symbol" },
    { code: "typeof y === 'bigint'", expected: "bigint" },
    { code: "'bigint' === typeof x", expected: "bigint" }
  ])("extracts literal from $code", ({ code, expected }) => {
    expect(getTypeofLiteral(parseBinaryExpression(code))).toBe(expected);
  });

  it.each([
    { code: "typeof x == 'bigint'" },
    { code: "typeof x != 'bigint'" },
    { code: "typeof x > 'bigint'" },
    { code: "x === 'bigint'" },
    { code: "x + 1" }
  ])("returns null for $code", ({ code }) => {
    expect(getTypeofLiteral(parseBinaryExpression(code))).toBeNull();
  });
});
