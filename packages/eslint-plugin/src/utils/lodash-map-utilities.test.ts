import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  extractBodyExpression,
  isMapCall,
  isObjectEntriesCall,
  isObjectFromEntriesCall,
  validateArrayParameter
} from "./lodash-map-utilities.ts";

const parseExpression = (code: string) => {
  const source = code.endsWith(";") ? code : `${code};`;
  const program = parseForESLint(source, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;
  for (const node of program.body) {
    if (AST_NODE_TYPES.ExpressionStatement !== node.type) {
      continue;
    }
    return { expression: node.expression, source };
  }
  throw new Error(`no expression statement found in: ${code}`);
};

const parseFunction = (code: string) => {
  const { expression } = parseExpression(code);
  return expression as TSESTree.ArrowFunctionExpression;
};

describe("isObjectFromEntriesCall", () => {
  it("returns true for Object.fromEntries(...)", () => {
    const { expression } = parseExpression("Object.fromEntries(pairs);");
    expect(isObjectFromEntriesCall(expression)).toBe(true);
  });

  it.each([
    ["Object.entries(...)", "Object.entries(obj);"],
    ["non-Object call", "Map.fromEntries(pairs);"],
    ["non-fromEntries method", "Object.keys(obj);"],
    ["non-call", "Object.fromEntries;"],
    ["computed property", "Object['fromEntries'](pairs);"]
  ])(`rejects %s`, (_, code) => {
    const { expression } = parseExpression(code);
    expect(isObjectFromEntriesCall(expression)).toBe(false);
  });
});

describe("isObjectEntriesCall", () => {
  it("returns true for Object.entries(...)", () => {
    const { expression } = parseExpression("Object.entries(obj);");
    expect(isObjectEntriesCall(expression)).toBe(true);
  });

  it.each([
    ["Object.keys(...)", "Object.keys(obj);"],
    ["Object.values(...)", "Object.values(obj);"],
    ["non-Object call", "Map.entries(obj);"],
    ["non-call", "Object.entries;"],
    ["computed property", "Object['entries'](obj);"]
  ])(`rejects %s`, (_, code) => {
    const { expression } = parseExpression(code);
    expect(isObjectEntriesCall(expression)).toBe(false);
  });
});

describe("isMapCall", () => {
  it("returns true for .map() calls", () => {
    const { expression } = parseExpression("arr.map(fn);");
    expect(isMapCall(expression)).toBe(true);
  });

  it.each([
    [".filter() calls", "arr.filter(fn);"],
    [".reduce() calls", "arr.reduce(fn, init);"],
    ["non-call", "arr.map;"],
    ["computed property map call", "arr['map'](fn);"]
  ])(`rejects %s`, (_, code) => {
    const { expression } = parseExpression(code);
    expect(isMapCall(expression)).toBe(false);
  });
});

describe("validateArrayParameter", () => {
  it("returns key/value names for valid array pattern", () => {
    const function_ = parseFunction("([k, v]) => [k.toUpperCase(), v];");
    const [firstParameter] = function_.params;
    if (!firstParameter) throw new Error("no param");
    const result = validateArrayParameter(firstParameter);
    expect(result).toEqual({ keyName: "k", valueName: "v" });
  });

  it.each([
    ["non-array pattern", "pair => pair;"],
    ["missing value", "([k]) => [k, 1];"],
    ["nested pattern", "([k, [nested]]) => [k, nested];"]
  ])(`returns null for %s`, (_, code) => {
    const function_ = parseFunction(code);
    const [firstParameter] = function_.params;
    if (!firstParameter) throw new Error("no param");
    expect(validateArrayParameter(firstParameter)).toBeNull();
  });
});

describe("extractBodyExpression", () => {
  it("returns expression body directly", () => {
    const function_ = parseFunction("([k, v]) => [k.toUpperCase(), v];");
    const result = extractBodyExpression(function_);
    expect(result?.type).toBe(AST_NODE_TYPES.ArrayExpression);
  });

  it("returns argument from block with single return", () => {
    const function_ = parseFunction("([k, v]) => { return [String(k), v]; };");
    const result = extractBodyExpression(function_);
    expect(result?.type).toBe(AST_NODE_TYPES.ArrayExpression);
  });

  it("returns null for block with multiple statements", () => {
    const function_ = parseFunction(
      "([k, v]) => { const x = k.toUpperCase(); return [x, v]; };"
    );
    expect(extractBodyExpression(function_)).toBeNull();
  });

  it("returns null for bare return statement", () => {
    const function_ = parseFunction("([k, v]) => { return; };");
    expect(extractBodyExpression(function_)).toBeNull();
  });
});
