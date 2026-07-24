import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findCall, linkParents } from "./.fixture.ts";
import {
  detectMapValuesPattern,
  extractBodyExpression,
  findKeyPassthroughCallback,
  isMapCall,
  isObjectEntriesCall,
  isObjectFromEntriesCall,
  validateArrayParameter,
  validateReturnArray
} from "./prefer-lodash-map-values.ts";

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

const parseFunction = (code: string) => {
  const { expression } = parseExpression(code);
  return expression as TSESTree.ArrowFunctionExpression;
};

const PARAM_KEY = "k";
const PARAM_VAL = "v";
const ARRAY_PARAM = `([${PARAM_KEY}, ${PARAM_VAL}])`;
const VALID_PATTERN_CODE = `([${PARAM_KEY}, ${PARAM_VAL}]) => [${PARAM_KEY}, ${PARAM_VAL} * 2];`;

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
    const function_ = parseFunction(VALID_PATTERN_CODE);
    const [firstParameter] = function_.params;
    if (!firstParameter) throw new Error("no param");
    const result = validateArrayParameter(firstParameter);
    expect(result).toEqual({ keyName: PARAM_KEY, valueName: PARAM_VAL });
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

describe("validateReturnArray", () => {
  it("returns the value transform expression", () => {
    const function_ = parseFunction(VALID_PATTERN_CODE);
    const result = validateReturnArray(function_, PARAM_KEY);
    expect(result).not.toBeNull();
    expect(result?.type).toBe(AST_NODE_TYPES.BinaryExpression);
  });

  const returnArrayCases: [string, string][] = [
    [
      "block body with multiple stmts",
      `${ARRAY_PARAM} => { const x = ${PARAM_VAL} * 2; return [${PARAM_KEY}, x]; };`
    ],
    ["non-return statement", `${ARRAY_PARAM} => { console.log('hi'); };`],
    ["3 elements", `${ARRAY_PARAM} => [${PARAM_KEY}, ${PARAM_VAL}, extra];`],
    ["key mismatch", `${ARRAY_PARAM} => [other, ${PARAM_VAL}];`],
    ["spread element", `${ARRAY_PARAM} => [${PARAM_KEY}, ...${PARAM_VAL}];`],
    ["trailing comma", `${ARRAY_PARAM} => [, ${PARAM_VAL}];`],
    ["first not identifier", `${ARRAY_PARAM} => [1, ${PARAM_VAL}];`],
    ["body not array", `${ARRAY_PARAM} => ${PARAM_KEY};`]
  ];
  it.each(returnArrayCases)(`handles %s`, (_, code) => {
    const function_ = parseFunction(code);
    const result = validateReturnArray(function_, PARAM_KEY);
    expect(result).toBeNull();
  });
});

describe("extractBodyExpression", () => {
  it("returns expression body directly", () => {
    const function_ = parseFunction(VALID_PATTERN_CODE);
    const result = extractBodyExpression(function_);
    expect(result?.type).toBe(AST_NODE_TYPES.ArrayExpression);
  });

  it("returns argument from block with single return", () => {
    const function_ = parseFunction(
      `([${PARAM_KEY}, ${PARAM_VAL}]) => { return [${PARAM_KEY}, String(${PARAM_VAL})]; };`
    );
    const result = extractBodyExpression(function_);
    expect(result?.type).toBe(AST_NODE_TYPES.ArrayExpression);
  });

  it("returns null for block with multiple statements", () => {
    const function_ = parseFunction(
      "([k, v]) => { const x = v * 2; return [k, x]; };"
    );
    expect(extractBodyExpression(function_)).toBeNull();
  });

  it("returns null for bare return statement", () => {
    const function_ = parseFunction(
      `([${PARAM_KEY}, ${PARAM_VAL}]) => { return; };`
    );
    expect(extractBodyExpression(function_)).toBeNull();
  });
});

describe("findKeyPassthroughCallback", () => {
  it("detects arrow function passing key through", () => {
    const function_ = parseFunction(VALID_PATTERN_CODE);
    const result = findKeyPassthroughCallback(function_);
    expect(result).not.toBeNull();
    expect(result?.keyName).toBe(PARAM_KEY);
    expect(result?.valName).toBe(PARAM_VAL);
  });

  it("detects block body with return", () => {
    const function_ = parseFunction(
      `([${PARAM_KEY}, ${PARAM_VAL}]) => { return [${PARAM_KEY}, String(${PARAM_VAL})]; };`
    );
    const result = findKeyPassthroughCallback(function_);
    expect(result).not.toBeNull();
  });

  it.each([
    ["key transformed", "([k, v]) => [k.toUpperCase(), v];"],
    ["3 elements", "([k, v]) => [k, v, extra];"],
    ["non-array param", "pair => pair;"],
    ["non-function node", "obj;"],
    ["multiple stmts", "([k, v]) => { const x = v * 2; return [k, x]; };"],
    ["non-return stmt", "([k, v]) => { console.log('hi'); };"],
    ["trailing comma", "([k, v]) => [, v];"],
    ["key name mismatch", "([k, v]) => [other, v];"],
    ["missing valPat", "([k]) => [k, 1];"],
    ["nested valPat", "([k, [nested]]) => [k, nested];"],
    ["no params", "() => ['a', 1];"],
    ["body not array", "([k, v]) => k;"],
    ["first not identifier", "([k, v]) => [1, v];"],
    ["spread element", "([k, v]) => [k, ...v];"]
  ])(`returns null when %s`, (_, code) => {
    const { expression } = parseExpression(code);
    expect(findKeyPassthroughCallback(expression)).toBeNull();
  });
});

describe("detectMapValuesPattern", () => {
  it("detects the canonical pattern", () => {
    const { call } = findCall(
      "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v * 2]));"
    );
    const match = detectMapValuesPattern(call);
    expect(match).not.toBeNull();
    expect(match?.objExpr.type).toBe(AST_NODE_TYPES.Identifier);
  });

  it.each([
    ["Object.fromEntries without map", "Object.fromEntries(pairs);"],
    ["map without Object.entries", "Object.fromEntries(arr.map(x => [x, x]));"],
    [
      "key transformed",
      "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toUpperCase(), v]));"
    ],
    [
      "no callback params",
      "Object.fromEntries(Object.entries(obj).map(() => ['a', 1]));"
    ],
    ["non-call node", "obj;"]
  ])(`returns null for %s`, (_, code) => {
    const { expression } = parseExpression(code);
    expect(detectMapValuesPattern(expression)).toBeNull();
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
    expect(detectMapValuesPattern(call)).toBeNull();
  });
});
