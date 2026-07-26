import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findCall, linkParents } from "../rules/.fixture.ts";
import {
  detectEntriesMapPattern,
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
  linkParents(program);
  for (const node of program.body) {
    if (AST_NODE_TYPES.ExpressionStatement !== node.type) {
      continue;
    }
    return { expression: node.expression, source };
  }
  throw new Error(`no expression statement found in: ${code}`);
};

describe("isObjectFromEntriesCall", () => {
  it("returns true for Object.fromEntries(...)", () => {
    const { call } = findCall("Object.fromEntries(pairs);");
    expect(isObjectFromEntriesCall(call)).toBe(true);
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
    const { call } = findCall("Object.entries(obj);");
    expect(isObjectEntriesCall(call)).toBe(true);
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
    const { call } = findCall("arr.map(fn);");
    expect(isMapCall(call)).toBe(true);
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
    const { expression } = parseExpression("([k, v]) => [k, v * 2];");
    const arrowFunction = expression as TSESTree.ArrowFunctionExpression;
    const [firstParameter] = arrowFunction.params;
    if (!firstParameter) throw new Error("no param");
    const result = validateArrayParameter(firstParameter);
    expect(result).toEqual({ keyName: "k", valueName: "v" });
  });

  it.each([
    ["non-array pattern", "pair => pair;"],
    ["missing value", "([k]) => [k, 1];"],
    ["nested pattern", "([k, [nested]]) => [k, nested];"]
  ])(`returns null for %s`, (_, code) => {
    const { expression } = parseExpression(code);
    const arrowFunction = expression as TSESTree.ArrowFunctionExpression;
    const [firstParameter] = arrowFunction.params;
    if (!firstParameter) throw new Error("no param");
    expect(validateArrayParameter(firstParameter)).toBeNull();
  });
});

describe("extractBodyExpression", () => {
  it("returns expression body directly", () => {
    const { expression } = parseExpression("([k, v]) => [k, v * 2];");
    const arrowFunction = expression as TSESTree.ArrowFunctionExpression;
    const result = extractBodyExpression(arrowFunction);
    expect(result?.type).toBe(AST_NODE_TYPES.ArrayExpression);
  });

  it("returns argument from block with single return", () => {
    const { expression } = parseExpression(
      "([k, v]) => { return [k, String(v)]; };"
    );
    const arrowFunction = expression as TSESTree.ArrowFunctionExpression;
    const result = extractBodyExpression(arrowFunction);
    expect(result?.type).toBe(AST_NODE_TYPES.ArrayExpression);
  });

  it("returns null for block with multiple statements", () => {
    const { expression } = parseExpression(
      "([k, v]) => { const x = v * 2; return [k, x]; };"
    );
    const arrowFunction = expression as TSESTree.ArrowFunctionExpression;
    expect(extractBodyExpression(arrowFunction)).toBeNull();
  });

  it("returns null for bare return statement", () => {
    const { expression } = parseExpression("([k, v]) => { return; };");
    const arrowFunction = expression as TSESTree.ArrowFunctionExpression;
    expect(extractBodyExpression(arrowFunction)).toBeNull();
  });
});

describe("detectEntriesMapPattern", () => {
  it("detects the canonical Object.fromEntries(entries(map)) pattern", () => {
    const { call } = findCall(
      "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v * 2]));"
    );
    const match = detectEntriesMapPattern(call);
    expect(match).not.toBeNull();
    expect(match?.objExpr.type).toBe(AST_NODE_TYPES.Identifier);
    expect(match?.callback.type).toBe(AST_NODE_TYPES.ArrowFunctionExpression);
  });

  it("works with block body callbacks", () => {
    const { call } = findCall(
      "Object.fromEntries(Object.entries(obj).map(([k, v]) => { return [k, String(v)]; }));"
    );
    const match = detectEntriesMapPattern(call);
    expect(match).not.toBeNull();
  });

  it("works with function expression callbacks", () => {
    const { call } = findCall(
      "Object.fromEntries(Object.entries(obj).map(function([k, v]) { return [k, v.length]; }));"
    );
    const match = detectEntriesMapPattern(call);
    expect(match).not.toBeNull();
  });

  it("works with nested object expressions", () => {
    const { call } = findCall(
      "Object.fromEntries(Object.entries(config.settings).map(([k, v]) => [k, v.default]));"
    );
    const match = detectEntriesMapPattern(call);
    expect(match).not.toBeNull();
    expect(match?.objExpr.type).toBe(AST_NODE_TYPES.MemberExpression);
  });

  it("returns null when callback is not a function expression", () => {
    const { call } = findCall(
      "Object.fromEntries(Object.entries(obj).map(someFn));"
    );
    expect(detectEntriesMapPattern(call)).toBeNull();
  });

  it.each([
    ["Object.fromEntries without map", "Object.fromEntries(pairs);"],
    ["map without Object.entries", "Object.fromEntries(arr.map(x => [x, x]));"],
    ["non-call node", "obj;"]
  ])(`returns null for %s`, (_, code) => {
    const { expression } = parseExpression(code);
    expect(detectEntriesMapPattern(expression)).toBeNull();
  });

  it.each([
    ["no fromEntries args", "Object.fromEntries();"],
    ["no map callback", "Object.fromEntries(Object.entries(obj).map());"],
    [
      "no entries args",
      "Object.fromEntries(Object.entries().map(([k, v]) => [k, v * 2]));"
    ],
    [
      "mapCallee not MemberExpression",
      "Object.fromEntries(mapFn(Object.entries(obj)));"
    ],
    [
      "spread object argument",
      "Object.fromEntries(Object.entries(...args).map(([k, v]) => [k, v * 2]));"
    ]
  ])(`returns null when %s`, (_, code) => {
    const { call } = findCall(code);
    expect(detectEntriesMapPattern(call)).toBeNull();
  });
});
