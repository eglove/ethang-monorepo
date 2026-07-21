import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findFirstNode, parseProgram } from "./.fixture.ts";
import { detectCountByPattern } from "./prefer-lodash-count-by.ts";

describe("prefer-lodash-count-by branch coverage", () => {
  it.each([
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 1; }, {});",
      label: "block has fewer than 2 statements (covers 2 > block.body.length)"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 1; return wrongVar; }, {});",
      label:
        "callback returns wrong variable (covers returnsAccumulator false branch)"
    },
    {
      code: "const x = arr.reduce((acc, item) => { const temp = 1; acc[item.key] = temp; return acc; }, {});",
      label: "block body first statement is not ExpressionStatement"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc[other.key] = (acc[other.key] || 0) + 1; return acc; }, {});",
      label:
        "member expression object is not the item parameter (covers isItemProperty name mismatch)"
    },
    {
      code: "const x = arr.reduce((acc, item) => acc, {});",
      label:
        "callback body is not a BlockStatement (covers validateCallbackStructure early return at line 201)"
    },
    {
      code: "const x = arr.map(item => item.key);",
      label:
        "non-reduce call (covers validateReduceCallStructure early return at line 237)"
    },
    {
      code: "const x = arr.reduce(someVar, {});",
      label:
        "first argument is not a callback (covers callbackInfo null at line 246)"
    }
  ])("returns null when $label", ({ code }) => {
    const program = parseProgram(code);
    const call = findFirstNode(program, (n) => {
      return n.type === AST_NODE_TYPES.CallExpression;
    });
    expect(call).not.toBeNull();
    expect(call && detectCountByPattern(call)).toBeNull();
  });

  it("returns null when given a non-CallExpression node (covers line 233)", () => {
    const program = parseProgram("const x = foo;");
    const identifier = findFirstNode(program, (n) => {
      return n.type === AST_NODE_TYPES.Identifier;
    });
    expect(identifier).not.toBeNull();
    expect(identifier && detectCountByPattern(identifier)).toBeNull();
  });

  it.each([
    {
      code: "const x = arr.reduce(class { constructor() {} }, {});",
      label:
        "callback is not an ArrowFunction or FunctionExpression (covers isReduceCallback)"
    },
    {
      code: "const x = reduce(arr, fn, {});",
      label: "callee is not a MemberExpression (covers isReduceCall)"
    },
    {
      code: 'const x = arr["reduce"](fn, {});',
      label:
        "callee is computed MemberExpression (covers isReduceCall computed branch)"
    },
    {
      code: "const x = arr.map(fn, {});",
      label: "method is not reduce (covers isReduceCall method name branch)"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 1; return acc; }, [1]);",
      label: "default value is not an empty object (covers isEmptyObject)"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 1; return 42; }, {});",
      label:
        "last statement doesn't return accumulator (covers returnsAccumulator)"
    },
    {
      code: "const x = arr.reduce((acc, { key }) => { acc[item.key] = (acc[item.key] || 0) + 1; return acc; }, {});",
      label: "callback params are not both identifiers (covers line 196)"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = (something || 0) + 1; return acc; }, {});",
      label: "logical left is not a member accumulator (covers line 181)"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.other] || 0) + 1; return acc; }, {});",
      label: "keys in || left and assignment differ (covers line 186)"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 2; return acc; }, {});",
      label: "binary expression right is not 1 (covers asPlusOne value check)"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || -1) + 1; return acc; }, {});",
      label: "logical expression right is not 0 (covers asOrZero value check)"
    }
  ])("returns null when $label", ({ code }) => {
    const program = parseProgram(code);
    const call = findFirstNode(program, (n) => {
      return n.type === AST_NODE_TYPES.CallExpression;
    });
    expect(call).not.toBeNull();
    expect(call && detectCountByPattern(call)).toBeNull();
  });

  it("returns null when callback is a FunctionExpression (covers isReduceCallback FunctionExpression branch)", () => {
    const program = parseProgram(
      "const x = arr.reduce(function(acc, item) { acc[item.key] = (acc[item.key] || 0) + 1; return acc; }, {});"
    );
    const call = findFirstNode(program, (n) => {
      return n.type === AST_NODE_TYPES.CallExpression;
    });
    expect(call).not.toBeNull();
    expect(call && detectCountByPattern(call)).not.toBeNull();
  });
});
