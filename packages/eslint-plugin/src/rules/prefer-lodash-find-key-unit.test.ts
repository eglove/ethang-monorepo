import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";
import { describe, expect, it } from "vitest";

import {
  expressionStatement,
  findCall,
  findIdentifier,
  firstExpression,
  linkParents,
  parseProgram
} from "./.fixture.ts";
import {
  bodyUsesParameterOutsideObjectAccess,
  collectObjectParameterAccesses,
  detectFindKeyPattern,
  getExpressionBody,
  getFirstArrowCallbackArgument,
  getFirstIdentifierArgument,
  getMemberExpressionCallee,
  getSafeBodyAccesses,
  getSingleIdentifierArrowParameter,
  isFindCall,
  isObjectKeysCall,
  isObjectParameterAccess,
  resolveObjectKeysInner
} from "./prefer-lodash-find-key.ts";

const KEY_NAME = "k";
const OBJ_NAME = "obj";
const EACH_TITLE = "returns %s for %s";
const OBJ_K_EQ_V = "k => obj[k] === 'v';";
const K_STARTS_WITH_A = "k => k.startsWith('a');";

const arrowExpression = (code: string) => {
  const program = parseProgram(code);
  linkParents(program);
  const statement = expressionStatement(code);
  return statement.expression as TSESTree.ArrowFunctionExpression;
};

const firstStatementExpression = (code: string) => {
  const program = parseProgram(code);
  linkParents(program);
  return firstExpression(code) as TSESTree.CallExpression;
};

const innerCallOf = (code: string) => {
  const outer = firstStatementExpression(code);
  const { callee } = outer;
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    throw new Error(`expected member expression callee in: ${code}`);
  }
  return callee.object as TSESTree.CallExpression;
};

const isIdentifierName = (
  value: null | TSESTree.Identifier | undefined,
  expected: null | string
) => {
  return expected === (value?.name ?? null);
};

const OBJECT_KEYS_CASES = [
  ["Object.keys(o)", true],
  ["Object.keys(obj)", true],
  ["Reflect.ownKeys(o)", false],
  ["myKeys(o)", false],
  ["Object[keys](o)", false],
  ["((a.b)).keys(o)", false],
  ["Object['keys'](o)", false]
] as const;

describe("isObjectKeysCall", () => {
  it.each(OBJECT_KEYS_CASES)(EACH_TITLE, (code, expected) => {
    expect(isObjectKeysCall(firstStatementExpression(`${code};`))).toBe(
      expected
    );
  });
  it("returns false for a bare identifier", () => {
    expect(isObjectKeysCall(findIdentifier("Object;"))).toBe(false);
  });
});

const FIND_CALL_CASES = [
  ["arr.find(x => x > 0)", true],
  ["arr.filter(x => x > 0)", false],
  ["arr[find](x => x > 0)", false],
  ["arr['find'](x => x > 0)", false]
] as const;

describe("isFindCall", () => {
  it.each(FIND_CALL_CASES)(EACH_TITLE, (code, expected) => {
    expect(isFindCall(firstStatementExpression(`${code};`))).toBe(expected);
  });
  it("returns false for a bare identifier", () => {
    expect(isFindCall(findIdentifier("arr.find;"))).toBe(false);
  });
});

describe("getMemberExpressionCallee", () => {
  it.each([
    ["obj.find(x => x);", true],
    ["find(x => x);", false]
  ])("returns member for %s", (code, shouldHaveMember) => {
    const { call } = findCall(code);
    const result = getMemberExpressionCallee(call);
    expect(!isNil(result)).toBe(shouldHaveMember);
  });
  it("returns null for an identifier callee", () => {
    const { call } = findCall("find(x);");
    expect(getMemberExpressionCallee(call)).toBeNull();
  });
});

const SINGLE_ID_ARROW_CASES = [
  ["(x) => x", "x"],
  ["(x, y) => x", null],
  ["({x}) => x", null]
] as const;

describe("getSingleIdentifierArrowParameter", () => {
  it.each(SINGLE_ID_ARROW_CASES)(EACH_TITLE, (code, expectedName) => {
    const arrow = arrowExpression(`${code};`);
    expect(
      isIdentifierName(getSingleIdentifierArrowParameter(arrow), expectedName)
    ).toBe(true);
  });
});

describe("getExpressionBody", () => {
  it.each([
    ["x => x", true],
    ["x => { return x; }", false]
  ])("returns expression for %s", (code, expectedPresent) => {
    const arrow = arrowExpression(`${code};`);
    expect(!isNil(getExpressionBody(arrow))).toBe(expectedPresent);
  });
});

const FIRST_IDENT_CASES = [
  ["fn(obj)", "obj"],
  ["fn()", null],
  ["fn(1)", null]
] as const;

describe("getFirstIdentifierArgument", () => {
  it.each(FIRST_IDENT_CASES)(EACH_TITLE, (code, expectedName) => {
    const { call } = findCall(code);
    expect(
      isIdentifierName(getFirstIdentifierArgument(call), expectedName)
    ).toBe(true);
  });
});

describe("getFirstArrowCallbackArgument", () => {
  it.each([
    ["fn(x => x)", true],
    ["fn(1)", false]
  ])("returns arrow for %s", (code, expectedPresent) => {
    const { call } = findCall(code);
    expect(!isNil(getFirstArrowCallbackArgument(call))).toBe(expectedPresent);
  });
});

const RESOLVE_INNER_CASES = [
  ["Object.keys(obj).find(k => obj[k] === 'v');", "obj"],
  ["Reflect.ownKeys(obj).find(k => true);", null],
  ["obj.find(k => true);", null],
  ["Object.keys({a: 1}).find(k => true);", null]
] as const;

describe("resolveObjectKeysInner", () => {
  it.each(RESOLVE_INNER_CASES)(
    "resolves inner call for %s",
    (code, expectedName) => {
      const inner = innerCallOf(code);
      expect(
        isIdentifierName(
          resolveObjectKeysInner(inner)?.objectArgument ?? null,
          expectedName
        )
      ).toBe(true);
    }
  );
});

const BODY_USES_PARAM_CASES = [
  [OBJ_K_EQ_V, false],
  [K_STARTS_WITH_A, true],
  ["k => obj.foo;", false]
] as const;

describe("bodyUsesParameterOutsideObjectAccess", () => {
  it.each(BODY_USES_PARAM_CASES)(EACH_TITLE, (code, expected) => {
    const arrow = arrowExpression(code);
    expect(
      bodyUsesParameterOutsideObjectAccess(arrow.body, OBJ_NAME, KEY_NAME)
    ).toBe(expected);
  });
});

const COLLECT_CASES = [
  ["k => obj[k];", 1],
  ["k => obj[k] + obj[k];", 2],
  [K_STARTS_WITH_A, 0],
  ["k => obj.foo;", 0],
  ["k => other[k];", 0]
] as const;

describe("collectObjectParameterAccesses", () => {
  it.each(COLLECT_CASES)("collects %s accesses for %s", (code, expected) => {
    const arrow = arrowExpression(code);
    expect(
      collectObjectParameterAccesses(arrow.body, OBJ_NAME, KEY_NAME)
    ).toHaveLength(expected);
  });
});

describe("getSafeBodyAccesses", () => {
  const safeAccesses = (code: string) => {
    const arrow = arrowExpression(code);
    const { body } = arrow;
    if (AST_NODE_TYPES.BlockStatement === body.type) {
      return null;
    }
    return getSafeBodyAccesses(body, OBJ_NAME, KEY_NAME);
  };
  it("returns the accesses for a valid body", () => {
    expect(safeAccesses(OBJ_K_EQ_V)?.length).toBe(1);
  });
  it("returns null when no accesses exist", () => {
    expect(safeAccesses(K_STARTS_WITH_A)).toBeNull();
  });
  it("returns null when parameter is used outside access", () => {
    expect(safeAccesses("k => obj[k] + k.length;")).toBeNull();
  });
});

const DETECT_CASES = [
  ["arr.map(x => x);", false],
  ["find(x => x);", false],
  ["arr.find(x => x);", false],
  ["Object.keys(obj).find(k => obj[k] === 'value');", true],
  ["Object.keys(obj).find();", false],
  ["Object.keys(obj).find((k, i) => obj[k] === 'v');", false],
  ["Object.keys(obj).find(k => { return obj[k] === 'v'; });", false],
  ["Object.keys(obj).find(k => k.startsWith('a'));", false]
] as const;

describe("detectFindKeyPattern", () => {
  it.each(DETECT_CASES)(EACH_TITLE, (code, expectedDetected) => {
    const { call } = findCall(code);
    expect(!isNil(detectFindKeyPattern(call))).toBe(expectedDetected);
  });
});

const PARAMETER_ACCESS_CASES = [
  ["obj[k];", true, "obj", "k"],
  ["obj;", false, "obj", "k"],
  ["obj.foo;", false, "obj", "foo"],
  ["(a.b)[k];", false, "obj", "k"],
  ["other[k];", false, "obj", "k"],
  ["obj[0];", false, "obj", "0"],
  ["obj[other];", false, "obj", "k"]
] as const;

describe("isObjectParameterAccess", () => {
  it.each(PARAMETER_ACCESS_CASES)(
    "matches for %s",
    (code, expected, objectName, propertyName) => {
      const program = parseProgram(code);
      linkParents(program);
      const expression = firstExpression(code);
      expect(
        isObjectParameterAccess(expression, objectName, propertyName)
      ).toBe(expected);
    }
  );
});
