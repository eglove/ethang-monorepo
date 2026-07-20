import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findFirstNode, parseProgram } from "./.fixture.ts";
import { detectKeyByPattern } from "./prefer-lodash-key-by.ts";

describe("prefer-lodash-key-by branch coverage", () => {
  it.each([
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = item; return acc; }, {});",
      expectMatch: true,
      label: "arrow keyBy pattern (covers full detectKeyByPattern path)"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = item; return wrongVar; }, {});",
      expectMatch: false,
      label:
        "callback returns wrong variable (covers returnsAccumulator false branch)"
    },
    {
      code: "const x = arr.reduce((acc, item) => { const temp = 1; acc[item.key] = temp; return acc; }, {});",
      expectMatch: false,
      label: "block body first statement is not ExpressionStatement"
    },
    {
      code: "const x = arr.reduce((acc) => { acc[item.key] = item; return acc; }, {});",
      expectMatch: false,
      label: "callback has fewer than 2 parameters"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = 'constant'; return acc; }, {});",
      expectMatch: false,
      label: "right side of assignment is not the item identifier"
    },
    {
      code: "const x = arr.reduce(function(acc, item) { acc[item.key] = item; return acc; }, {});",
      expectMatch: true,
      label:
        "callback is function expression (covers isReduceCallback FunctionExpression branch)"
    },
    {
      code: "const x = arr.reduce((acc, item) => acc, {});",
      expectMatch: false,
      label: "callback body is not a BlockStatement"
    },
    {
      code: "const x = arr.reduce(1, 2, 3);",
      expectMatch: false,
      label: "non-reduce member expression call"
    }
  ])("$label", ({ code, expectMatch }) => {
    const program = parseProgram(code);
    const call = findFirstNode(program, (n) => {
      return n.type === AST_NODE_TYPES.CallExpression;
    });
    expect(call).not.toBeNull();
    if (expectMatch) {
      expect(call && detectKeyByPattern(call)).not.toBeNull();
    } else {
      expect(call && detectKeyByPattern(call)).toBeNull();
    }
  });
});
