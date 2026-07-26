import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findCall, linkParents } from "./.fixture.ts";
import {
  detectMapKeysPattern,
  findValuePassthroughCallback,
  validateReturnArray
} from "./prefer-lodash-map-keys.ts";

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
const VALID_PATTERN_CODE = `([${PARAM_KEY}, ${PARAM_VAL}]) => [${PARAM_KEY}.toUpperCase(), ${PARAM_VAL}];`;

describe("validateReturnArray", () => {
  it("returns the key transform expression", () => {
    const function_ = parseFunction(VALID_PATTERN_CODE);
    const result = validateReturnArray(function_, PARAM_VAL);
    expect(result).not.toBeNull();
    expect(result?.type).toBe(AST_NODE_TYPES.CallExpression);
  });

  const returnArrayCases: [string, string][] = [
    [
      "block body with multiple stmts",
      `${ARRAY_PARAM} => { const x = ${PARAM_KEY}.toUpperCase(); return [x, ${PARAM_VAL}]; };`
    ],
    ["non-return statement", `${ARRAY_PARAM} => { console.log('hi'); };`],
    ["3 elements", `${ARRAY_PARAM} => [${PARAM_KEY}, ${PARAM_VAL}, extra];`],
    [
      "value mismatch",
      `${ARRAY_PARAM} => [${PARAM_KEY}.toUpperCase(), other];`
    ],
    ["spread element", `${ARRAY_PARAM} => [...${PARAM_KEY}, ${PARAM_VAL}];`],
    ["trailing comma", `${ARRAY_PARAM} => [, ${PARAM_VAL}];`],
    [
      "second not identifier",
      `${ARRAY_PARAM} => [${PARAM_KEY}.toUpperCase(), 1];`
    ],
    ["body not array", `${ARRAY_PARAM} => ${PARAM_KEY};`]
  ];
  it.each(returnArrayCases)(`handles %s`, (_, code) => {
    const function_ = parseFunction(code);
    const result = validateReturnArray(function_, PARAM_VAL);
    expect(result).toBeNull();
  });
});

describe("findValuePassthroughCallback", () => {
  it("detects arrow function passing value through", () => {
    const function_ = parseFunction(VALID_PATTERN_CODE);
    const result = findValuePassthroughCallback(function_);
    expect(result).not.toBeNull();
    expect(result?.keyName).toBe(PARAM_KEY);
    expect(result?.valName).toBe(PARAM_VAL);
  });

  it("detects block body with return", () => {
    const function_ = parseFunction(
      `([${PARAM_KEY}, ${PARAM_VAL}]) => { return [String(${PARAM_KEY}), ${PARAM_VAL}]; };`
    );
    const result = findValuePassthroughCallback(function_);
    expect(result).not.toBeNull();
  });

  it.each([
    ["value transformed", "([k, v]) => [k, v * 2];"],
    ["3 elements", "([k, v]) => [k, v, extra];"],
    ["non-array param", "pair => pair;"],
    ["non-function node", "obj;"],
    [
      "multiple stmts",
      "([k, v]) => { const x = k.toUpperCase(); return [x, v]; };"
    ],
    ["non-return stmt", "([k, v]) => { console.log('hi'); };"],
    ["trailing comma", "([k, v]) => [, v];"],
    ["value name mismatch", "([k, v]) => [k.toUpperCase(), other];"],
    ["missing valPat", "([k]) => [k, 1];"],
    ["nested valPat", "([k, [nested]]) => [k, nested];"],
    ["no params", "() => ['a', 1];"],
    ["body not array", "([k, v]) => k;"],
    ["second not identifier", "([k, v]) => [k.toUpperCase(), 1];"],
    ["spread element", "([k, v]) => [...k, v];"]
  ])(`returns null when %s`, (_, code) => {
    const { expression } = parseExpression(code);
    expect(findValuePassthroughCallback(expression)).toBeNull();
  });
});

describe("detectMapKeysPattern", () => {
  it("detects the canonical pattern", () => {
    const { call } = findCall(
      "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toUpperCase(), v]));"
    );
    const match = detectMapKeysPattern(call);
    expect(match).not.toBeNull();
    expect(match?.objExpr.type).toBe(AST_NODE_TYPES.Identifier);
  });

  it.each([
    ["Object.fromEntries without map", "Object.fromEntries(pairs);"],
    ["map without Object.entries", "Object.fromEntries(arr.map(x => [x, x]));"],
    [
      "value transformed",
      "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v * 2]));"
    ],
    [
      "no callback params",
      "Object.fromEntries(Object.entries(obj).map(() => ['a', 1]));"
    ],
    ["non-call node", "obj;"]
  ])(`returns null for %s`, (_, code) => {
    const { expression } = parseExpression(code);
    expect(detectMapKeysPattern(expression)).toBeNull();
  });

  it.each([
    ["no fromEntries args", "Object.fromEntries();"],
    ["no map callback", "Object.fromEntries(Object.entries(obj).map());"],
    [
      "no entries args",
      "Object.fromEntries(Object.entries().map(([k, v]) => [k.toUpperCase(), v]));"
    ],
    [
      "mapCallee not MemberExpression",
      "Object.fromEntries(mapFn(Object.entries(obj)));"
    ],
    [
      "spread object argument",
      "Object.fromEntries(Object.entries(...args).map(([k, v]) => [k.toUpperCase(), v]));"
    ]
  ])(`returns null when %s`, (_, code) => {
    const { call } = findCall(code);
    expect(detectMapKeysPattern(call)).toBeNull();
  });
});
