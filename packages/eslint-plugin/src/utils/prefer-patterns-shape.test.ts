import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";
import { describe, expect, it } from "vitest";

import {
  expressionStatement,
  findBinary,
  findCall,
  findIdentifier,
  findSliceCall,
  firstStatement,
  identifierExpression,
  linkParents,
  parseProgram
} from "../rules/.fixture.ts";
import {
  getAccumulatorAssignment,
  getFilterCallReceiver,
  getNegatedPredicateArgument,
  getPartitionIterateeInfo,
  getReturnedValue,
  getSingleParameterArrow,
  hasMatchingVariableDeclarator,
  isChunkBlockBody,
  isChunkIncrementStatement,
  isChunkPushStatement,
  isChunkSliceCall,
  isChunkSliceFirstArgument,
  isChunkSliceOffsetBinary,
  isCountByAssignment,
  isCountOrKeyByPattern,
  isKeyByShape,
  isMatchingNegatedFilter,
  isNegatedPredicateCall,
  isProgramWithNegatedFilter,
  isSameReceiverNode,
  isSingleParameterArrowBody,
  shouldPreferChunk,
  shouldPreferCountBy,
  shouldPreferKeyBy,
  shouldPreferPartition
} from "./prefer-patterns-shape.ts";

const ARR_FILTER = "arr.filter";
const ARR_MAP = "arr.map";
const ARR_REDUCE = "arr.reduce";
const ARR_SLICE = "arr.slice";
const OUT_PUSH = "out.push";
const EACH_TITLE = "returns $expected for $code";
const CONST_X_EQ_1 = "const x = 1;";

const buildBlock = (code: string) => {
  const program = parseProgram(code);
  return {
    body: [...program.body],
    type: AST_NODE_TYPES.BlockStatement
  } as TSESTree.BlockStatement;
};

const findWhileStatement = (code: string) => {
  const program = parseProgram(code);
  return program.body[0] as TSESTree.WhileStatement;
};

describe("getReturnedValue", () => {
  it.each([
    {
      code: `${ARR_MAP}((x) => x * 2);`,
      expectedType: AST_NODE_TYPES.BinaryExpression
    },
    {
      code: `${ARR_MAP}((x) => { return x; });`,
      expectedType: AST_NODE_TYPES.Identifier
    },
    {
      code: "arr.forEach((x) => { foo(x); });",
      expectedType: AST_NODE_TYPES.CallExpression
    },
    { code: "arr.forEach((x) => { const y = x; });", expectedType: null }
  ])("returns $expectedType for $code", ({ code, expectedType }) => {
    const { call } = findCall(code);
    const arrow = call.arguments[0] as TSESTree.ArrowFunctionExpression;
    const result = getReturnedValue(arrow);
    const isExpectedNull: boolean = isNil(expectedType);
    if (isExpectedNull) {
      expect(result).toBeNull();
    } else {
      expect(result?.type).toBe(expectedType);
    }
  });
  it("function expression", () => {
    const { call } = findCall("arr.map(function (x) { return x * 2; });");
    const function_ = call.arguments[0] as TSESTree.FunctionExpression;
    const result = getReturnedValue(function_);
    expect(result?.type).toBe(AST_NODE_TYPES.BinaryExpression);
  });
  it("null", () => {
    expect(getReturnedValue(null)).toBeNull();
  });
  it("undefined", () => {
    expect(getReturnedValue(undefined)).toBeNull();
  });
});

describe("getFilterCallReceiver", () => {
  it.each([
    { code: `${ARR_FILTER}(fn);`, expected: true },
    { code: `${ARR_MAP}(fn);`, expected: false },
    { code: `filter(arr, fn);`, expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { call } = findCall(code);
    if (expected) {
      expect(getFilterCallReceiver(call)).not.toBeNull();
    } else {
      expect(getFilterCallReceiver(call)).toBeNull();
    }
  });
});

describe("isSingleParameterArrowBody", () => {
  const codeSingleArrow = `${ARR_FILTER}((x) => x);`;
  const codeBlockReturn = `${ARR_FILTER}((x) => { return x; });`;
  const codeEmptyArrow = `${ARR_FILTER}(() => 1);`;
  const codeDestructured = `${ARR_FILTER}(({x}) => x);`;
  it.each([
    { code: codeSingleArrow, expected: true },
    { code: codeBlockReturn, expected: false },
    { code: codeEmptyArrow, expected: false },
    { code: codeDestructured, expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { call } = findCall(code);
    const arrow = call.arguments[0] as TSESTree.ArrowFunctionExpression;
    expect(isSingleParameterArrowBody(arrow)).toBe(expected);
  });
});

describe("getSingleParameterArrow", () => {
  it("true for canonical", () => {
    const { call } = findCall(`${ARR_FILTER}((x) => x);`);
    expect(getSingleParameterArrow(call.arguments[0])).not.toBeNull();
  });
  it("null input", () => {
    expect(getSingleParameterArrow(null)).toBeNull();
  });
  it("non-function", () => {
    const { call } = findCall(`${ARR_FILTER}(123);`);
    expect(getSingleParameterArrow(call.arguments[0])).toBeNull();
  });
});

describe("getNegatedPredicateArgument", () => {
  it.each([
    { code: `${ARR_FILTER}((x) => !pred(x));`, expected: true },
    { code: `${ARR_FILTER}((x) => pred(x));`, expected: false },
    { code: `${ARR_FILTER}((x) => -pred(x));`, expected: false },
    { code: `${ARR_FILTER}((x) => !x);`, expected: false },
    { code: `${ARR_FILTER}((x) => !obj.pred(x));`, expected: false },
    { code: `${ARR_FILTER}((x) => !other(x));`, expected: false },
    { code: `${ARR_FILTER}((x) => !pred(x, y));`, expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const program = parseProgram(code);
    const { expression } = program.body[0] as TSESTree.ExpressionStatement;
    const arrow = (expression as TSESTree.CallExpression)
      .arguments[0] as TSESTree.ArrowFunctionExpression;
    const { body } = arrow;
    if (body.type !== AST_NODE_TYPES.UnaryExpression) {
      expect(getNegatedPredicateArgument(expression, "pred")).toBeNull();
      return;
    }
    if (expected) {
      expect(getNegatedPredicateArgument(body, "pred")).not.toBeNull();
    } else {
      expect(getNegatedPredicateArgument(body, "pred")).toBeNull();
    }
  });
});

describe("isNegatedPredicateCall", () => {
  it("true for !pred(x)", () => {
    const program = parseProgram(`${ARR_FILTER}((x) => !pred(x));`);
    const { expression } = program.body[0] as TSESTree.ExpressionStatement;
    const arrow = (expression as TSESTree.CallExpression)
      .arguments[0] as TSESTree.ArrowFunctionExpression;
    const body = arrow.body as TSESTree.UnaryExpression;
    expect(isNegatedPredicateCall(body, "pred", "x")).toBe(true);
  });
  it("null body", () => {
    expect(isNegatedPredicateCall(null, "pred", "x")).toBe(false);
  });
  it("arg name mismatch", () => {
    const program = parseProgram(`${ARR_FILTER}((x) => !pred(y));`);
    const { expression } = program.body[0] as TSESTree.ExpressionStatement;
    const arrow = (expression as TSESTree.CallExpression)
      .arguments[0] as TSESTree.ArrowFunctionExpression;
    const body = arrow.body as TSESTree.UnaryExpression;
    expect(isNegatedPredicateCall(body, "pred", "x")).toBe(false);
  });
});

describe("hasMatchingVariableDeclarator", () => {
  it("true for matching var decl", () => {
    const code = `const evens = ${ARR_FILTER}((x) => isEven(x)); const odds = ${ARR_FILTER}((x) => !isEven(x));`;
    const program = parseProgram(code);
    const variableDeclaration = program.body[1] as TSESTree.VariableDeclaration;
    const receiver = (
      (program.body[0] as TSESTree.VariableDeclaration).declarations[0]
        .init as TSESTree.CallExpression
    ).callee as TSESTree.MemberExpression;
    expect(
      hasMatchingVariableDeclarator(
        variableDeclaration,
        receiver.object,
        "isEven",
        "x"
      )
    ).toBe(true);
  });
  it("false for non-call init", () => {
    const program = parseProgram(CONST_X_EQ_1);
    const variableDeclaration = program.body[0] as TSESTree.VariableDeclaration;
    expect(
      hasMatchingVariableDeclarator(
        variableDeclaration,
        identifierExpression("x"),
        "isEven",
        "x"
      )
    ).toBe(false);
  });
});

describe("isProgramWithNegatedFilter", () => {
  it("true for matching sibling", () => {
    const code = `const evens = ${ARR_FILTER}((x) => isEven(x)); const odds = ${ARR_FILTER}((x) => !isEven(x));`;
    const program = parseProgram(code);
    const receiver = (
      (program.body[0] as TSESTree.VariableDeclaration).declarations[0]
        .init as TSESTree.CallExpression
    ).callee as TSESTree.MemberExpression;
    expect(
      isProgramWithNegatedFilter(program, receiver.object, "isEven", "x")
    ).toBe(true);
  });
  it("false for empty", () => {
    expect(
      isProgramWithNegatedFilter(
        parseProgram(""),
        identifierExpression("x"),
        "pred",
        "p"
      )
    ).toBe(false);
  });
  it("false for non-matching sibling", () => {
    const code = `const evens = ${ARR_FILTER}((x) => isEven(x)); const odds = ${ARR_FILTER}((x) => !other(x));`;
    const program = parseProgram(code);
    const receiver = (
      (program.body[0] as TSESTree.VariableDeclaration).declarations[0]
        .init as TSESTree.CallExpression
    ).callee as TSESTree.MemberExpression;
    expect(
      isProgramWithNegatedFilter(program, receiver.object, "isEven", "x")
    ).toBe(false);
  });
  it("false for non-statement sibling", () => {
    expect(
      isProgramWithNegatedFilter(
        parseProgram("function foo() {}"),
        identifierExpression("x"),
        "pred",
        "p"
      )
    ).toBe(false);
  });
});

describe("isMatchingNegatedFilter", () => {
  it.each([
    { code: `${ARR_FILTER}((x) => !isEven(x));`, expected: true },
    { code: `${ARR_MAP}((x) => !isEven(x));`, expected: false },
    { code: `other.filter((x) => !isEven(x));`, expected: false },
    { code: `${ARR_FILTER}(123);`, expected: false },
    { code: `${ARR_FILTER}((y) => !isEven(x));`, expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { call } = findCall(code);
    const identifier = findIdentifier("arr;");
    expect(isMatchingNegatedFilter(call, identifier, "isEven", "x")).toBe(
      expected
    );
  });
});

describe("isSameReceiverNode", () => {
  it.each([
    { codeA: "foo;", codeB: "foo;", expected: true },
    { codeA: "foo;", codeB: "bar;", expected: false },
    { codeA: "a.b;", codeB: "a.b;", expected: true },
    { codeA: "a.b;", codeB: "a;", expected: false },
    { codeA: "a.b.c;", codeB: "a.b.c;", expected: true },
    { codeA: "a.b.c;", codeB: "a.b.d;", expected: true }
  ])("$codeA vs $codeB = $expected", ({ codeA, codeB, expected }) => {
    const a = expressionStatement(codeA).expression;
    const b = expressionStatement(codeB).expression;
    expect(isSameReceiverNode(a, b)).toBe(expected);
  });
});

describe("getPartitionIterateeInfo", () => {
  it.each([
    { code: `${ARR_FILTER}((x) => isEven(x));`, expected: "isEven" },
    { code: `${ARR_MAP}((x) => isEven(x));`, expected: null },
    { code: `[1, 2].filter((x) => isEven(x));`, expected: null },
    { code: `${ARR_FILTER}(123);`, expected: null },
    { code: `${ARR_FILTER}(({x}) => isEven(x));`, expected: null },
    { code: `${ARR_FILTER}((x) => x > 0);`, expected: null },
    { code: `${ARR_FILTER}((x) => isEven(y));`, expected: null }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { call } = findCall(code);
    const info = getPartitionIterateeInfo(call);
    const isExpectedNull: boolean = isNil(expected);
    if (isExpectedNull) {
      expect(info).toBeNull();
    } else {
      expect(info?.predicateCall.predName).toBe(expected);
    }
  });
});

describe("shouldPreferPartition", () => {
  it("canonical pair", () => {
    const code = `const evens = ${ARR_FILTER}((x) => isEven(x)); const odds = ${ARR_FILTER}((x) => !isEven(x));`;
    const program = parseProgram(code);
    const evensCall = (program.body[0] as TSESTree.VariableDeclaration)
      .declarations[0].init as TSESTree.CallExpression;
    expect(shouldPreferPartition(evensCall, program)).toBe(true);
  });
  it("lone filter", () => {
    const code = `const evens = ${ARR_FILTER}((x) => isEven(x));`;
    const program = parseProgram(code);
    const call = (program.body[0] as TSESTree.VariableDeclaration)
      .declarations[0].init as TSESTree.CallExpression;
    expect(shouldPreferPartition(call, program)).toBe(false);
  });
});

describe("getAccumulatorAssignment", () => {
  it.each([
    { code: "acc[x] = 1;", expected: true },
    { code: "foo();", expected: false },
    { code: "other[x] = 1;", expected: false },
    { code: "acc.x = 1;", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const statement = expressionStatement(code);
    if (expected) {
      expect(getAccumulatorAssignment(statement, "acc")).not.toBeNull();
    } else {
      expect(getAccumulatorAssignment(statement, "acc")).toBeNull();
    }
  });
  it("non-expression statement", () => {
    const statement = firstStatement(CONST_X_EQ_1);
    expect(getAccumulatorAssignment(statement, "acc")).toBeNull();
  });
});

describe("isCountByAssignment", () => {
  it.each([
    { code: "acc[k] = (acc[k] ?? 0) + 1;", expected: true },
    { code: "acc[k] = 5;", expected: false },
    { code: "acc[k] = (acc[k] ?? 0) - 1;", expected: false },
    { code: "acc[k] = (acc[k] ?? 0) + 2;", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const statement = expressionStatement(code);
    const expression = statement.expression as TSESTree.AssignmentExpression;
    expect(isCountByAssignment(expression)).toBe(expected);
  });
});

describe("isKeyByShape", () => {
  it("true for accumulator assignment", () => {
    const block = buildBlock("acc[k] = v;");
    expect(isKeyByShape(block, "acc")).toBe(true);
  });
  it("false for empty", () => {
    const block: TSESTree.BlockStatement = {
      body: [],
      type: AST_NODE_TYPES.BlockStatement
    } as unknown as TSESTree.BlockStatement;
    expect(isKeyByShape(block, "acc")).toBe(false);
  });
});

describe("isCountOrKeyByPattern", () => {
  it("countBy canonical", () => {
    const { call } = findCall(
      `${ARR_REDUCE}((acc, x) => { acc[x] = (acc[x] ?? 0) + 1; return acc; }, {});`
    );
    expect(isCountOrKeyByPattern(call, true)).toBe(true);
  });
  it("keyBy canonical", () => {
    const { call } = findCall(
      `${ARR_REDUCE}((acc, x) => { acc[x.id] = x; return acc; }, {});`
    );
    expect(isCountOrKeyByPattern(call, false)).toBe(true);
  });
  it("non-reduce", () => {
    const { call } = findCall(`${ARR_MAP}((acc, x) => x);`);
    expect(isCountOrKeyByPattern(call, true)).toBe(false);
  });
});

describe("shouldPreferCountBy", () => {
  it("canonical", () => {
    const { call } = findCall(
      `${ARR_REDUCE}((acc, x) => { acc[x] = (acc[x] ?? 0) + 1; return acc; }, {});`
    );
    expect(shouldPreferCountBy(call)).toBe(true);
  });
  it("keyBy shape", () => {
    const { call } = findCall(
      `${ARR_REDUCE}((acc, x) => { acc[x.id] = x; return acc; }, {});`
    );
    expect(shouldPreferCountBy(call)).toBe(false);
  });
});

describe("shouldPreferKeyBy", () => {
  it("canonical", () => {
    const { call } = findCall(
      `${ARR_REDUCE}((acc, x) => { acc[x.id] = x; return acc; }, {});`
    );
    expect(shouldPreferKeyBy(call)).toBe(true);
  });
  it("countBy shape", () => {
    const { call } = findCall(
      `${ARR_REDUCE}((acc, x) => { acc[x] = (acc[x] ?? 0) + 1; return acc; }, {});`
    );
    expect(shouldPreferKeyBy(call)).toBe(false);
  });
});

describe("isChunkSliceOffsetBinary", () => {
  it.each([
    { code: "i + size;", expected: true },
    { code: "i + 2;", expected: true },
    { code: "j + size;", expected: false },
    { code: "i + (1 + 1);", expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const identifier = findIdentifier("i;");
    const { binary } = findBinary(code);
    expect(isChunkSliceOffsetBinary(identifier, binary)).toBe(expected);
  });
  it("non-binary second", () => {
    const identifier = findIdentifier("i;");
    expect(isChunkSliceOffsetBinary(identifier, identifier)).toBe(false);
  });
});

describe("isChunkSliceFirstArgument", () => {
  it.each([
    { expected: true, firstCode: "i;", secondCode: "n;" },
    { expected: false, firstCode: "i;", secondCode: "i;" }
  ])(
    "returns $expected for $firstCode vs $secondCode",
    ({ expected, firstCode, secondCode }) => {
      const first = findIdentifier(firstCode);
      const second = findIdentifier(secondCode);
      expect(isChunkSliceFirstArgument(first, second)).toBe(expected);
    }
  );
  it("non-identifier first", () => {
    const { binary } = findBinary("1 + 2;");
    const n = findIdentifier("n;");
    expect(isChunkSliceFirstArgument(binary, n)).toBe(false);
  });
  it("binary offset", () => {
    const index = findIdentifier("i;");
    const { binary } = findBinary("i + 2;");
    expect(isChunkSliceFirstArgument(index, binary)).toBe(true);
  });
});

describe("isChunkSliceCall", () => {
  it.each([
    { code: `${ARR_SLICE}(i, i + 2);`, expected: true },
    { code: `${ARR_MAP}(fn);`, expected: false },
    { code: `[1, 2].slice(0, 2);`, expected: false },
    { code: `${ARR_SLICE}(0);`, expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const { call } = findCall(code);
    expect(isChunkSliceCall(call)).toBe(expected);
  });
});

describe("isChunkPushStatement", () => {
  it.each([
    { code: `${OUT_PUSH}(x);`, expected: true },
    { code: `out.pop(x);`, expected: false },
    { code: CONST_X_EQ_1, expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const statement = firstStatement(code);
    expect(isChunkPushStatement(statement)).toBe(expected);
  });
});

describe("isChunkIncrementStatement", () => {
  it.each([
    { code: "i += 2;", expected: true },
    { code: "i = 2;", expected: false },
    { code: CONST_X_EQ_1, expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const statement = firstStatement(code);
    expect(isChunkIncrementStatement(statement)).toBe(expected);
  });
});

describe("isChunkBlockBody", () => {
  it.each([
    {
      code: `while (i < n) { ${OUT_PUSH}(${ARR_SLICE}(i, i + 2)); i += 2; }`,
      expected: true
    },
    {
      code: `while (i < n) { ${OUT_PUSH}(${ARR_SLICE}(i, i + 2)); }`,
      expected: false
    },
    { code: "while (i < n) { foo(); i += 2; }", expected: false },
    { code: `while (i < n) { ${OUT_PUSH}(x); i = 2; }`, expected: false }
  ])(EACH_TITLE, ({ code, expected }) => {
    const whileStatement = findWhileStatement(code);
    expect(
      isChunkBlockBody(whileStatement.body as TSESTree.BlockStatement)
    ).toBe(expected);
  });
});

describe("shouldPreferChunk", () => {
  it("canonical", () => {
    const code = `let i = 0; const out = []; while (i < arr.length) { ${OUT_PUSH}(${ARR_SLICE}(i, i + 2)); i += 2; }`;
    const program = parseProgram(code);
    linkParents(program);
    const whileStatement = program.body[2] as TSESTree.WhileStatement;
    const sliceCall = findSliceCall(whileStatement);
    if (isNil(sliceCall)) {
      throw new Error("expected slice call in chunk pattern");
    }
    expect(shouldPreferChunk(sliceCall)).toBe(true);
  });
  it("non-slice", () => {
    const { call } = findCall("foo();");
    expect(shouldPreferChunk(call)).toBe(false);
  });
  it("not in push", () => {
    const { call } = findCall(`${ARR_SLICE}(0, 2);`);
    expect(shouldPreferChunk(call)).toBe(false);
  });
});
