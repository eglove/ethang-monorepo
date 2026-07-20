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
    }
  ])("returns null when $label", ({ code }) => {
    const program = parseProgram(code);
    const call = findFirstNode(program, (n) => {
      return n.type === AST_NODE_TYPES.CallExpression;
    });
    expect(call).not.toBeNull();
    expect(call && detectCountByPattern(call)).toBeNull();
  });
});
