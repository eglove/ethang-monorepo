import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  findCall,
  findIdentifier,
  linkParents,
  parseProgram
} from "./.fixture.ts";
import {
  detectEqualPattern,
  isJsonStringifyCall
} from "./prefer-effect-equal.ts";

const sourceTextFor = (code: string) => {
  return code.endsWith(";") ? code : `${code};`;
};

const getBinaryFromCode = (code: string) => {
  const program = parseProgram(code);
  linkParents(program);
  const statement = program.body[0];

  if (!statement) {
    throw new Error(`expected statement in: ${code}`);
  }
  if (AST_NODE_TYPES.ExpressionStatement !== statement.type) {
    throw new Error(`expected expression statement in: ${code}`);
  }
  const expression = statement.expression;
  if (AST_NODE_TYPES.BinaryExpression !== expression.type) {
    throw new Error(`expected binary expression in: ${code}`);
  }
  return expression;
};

describe("detectEqualPattern", () => {
  it.each([
    ["strict equal", "JSON.stringify(a) === JSON.stringify(b)"],
    ["strict not equal", "JSON.stringify(a) !== JSON.stringify(b)"],
    ["reversed operands", "JSON.stringify(b) === JSON.stringify(a)"],
    ["complex expressions", "JSON.stringify(obj.x) === JSON.stringify(data.y)"],
    [
      "with literals",
      "JSON.stringify({ key: 1 }) === JSON.stringify({ key: 1 })"
    ],
    ["nested calls", "JSON.stringify(fn(a, b)) === JSON.stringify(fn(c, d))"]
  ])("detects pattern for %s", (_, code) => {
    const binary = getBinaryFromCode(code);
    const match = detectEqualPattern(binary, sourceTextFor(code));
    expect(match).not.toBeNull();
    expect(match?.left.type).toBe(AST_NODE_TYPES.CallExpression);
    expect(match?.right.type).toBe(AST_NODE_TYPES.CallExpression);
  });

  it.each([
    ["only left side is JSON.stringify", "JSON.stringify(a) === other(b)"],
    ["only right side is JSON.stringify", "other(a) === JSON.stringify(b)"],
    ["loose equality", "JSON.stringify(a) == JSON.stringify(b)"],
    ["loose inequality", "JSON.stringify(a) != JSON.stringify(b)"],
    ["non-stringify call", "JSON.parse(a) === JSON.parse(b)"],
    ["different method name", "JSON.stringify(a) === JSON.parse(b)"],
    ["simple equality", "a === b"],
    ["string comparison", "'foo' === 'bar'"]
  ])("returns null for %s", (_, code) => {
    const binary = getBinaryFromCode(code);
    const match = detectEqualPattern(binary, sourceTextFor(code));
    expect(match).toBeNull();
  });

  it("returns null when node is not a binary expression", () => {
    const program = parseProgram("JSON.stringify(a);");
    linkParents(program);
    const statement = program.body[0];
    const expression = (statement as TSESTree.ExpressionStatement).expression;
    const match = detectEqualPattern(
      expression,
      sourceTextFor("JSON.stringify(a);")
    );
    expect(match).toBeNull();
  });
});

describe("isJsonStringifyCall", () => {
  it("returns true for JSON.stringify calls", () => {
    const { call } = findCall("JSON.stringify(a)");
    expect(isJsonStringifyCall(call)).toBe(true);
  });

  it.each([
    ["non-JSON object name", "other.stringify(a)"],
    ["non-Identifier object", "(a.b).stringify(x)"],
    ["non-stringify method name", "JSON.parse(a)"],
    ["computed property access", "JSON['parse'](a)"]
  ])("returns false for %s", (_, code) => {
    const { call } = findCall(code);
    expect(isJsonStringifyCall(call)).toBe(false);
  });

  it("returns false for non-call expression", () => {
    const identifier = findIdentifier("x");
    expect(isJsonStringifyCall(identifier)).toBe(false);
  });
});
