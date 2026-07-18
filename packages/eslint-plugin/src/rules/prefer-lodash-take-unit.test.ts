import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { firstExpression, linkParents, parseProgram } from "./.fixture.ts";
import {
  classifyTakeShape,
  detectTakePattern,
  formatTakeCall,
  getSliceArguments,
  isSliceCall,
  type TakeKind
} from "./prefer-lodash-take.ts";

const sliceCall = (code: string) => {
  const node = firstExpression(code);
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    throw new Error("expected a call expression");
  }
  return node;
};

describe("isSliceCall", () => {
  it.each([
    ["arr.slice(0, 2)", true],
    ["arr.slice(-2)", true],
    ["arr.slice()", true],
    ["foo()", false],
    ['arr["slice"](0, 2)', false],
    ["arr.splice(0, 2)", false],
    ["obj.foo(0, 2)", false],
    ["slice(0, 2)", false],
    ["arr[0]", false]
  ])("%s → %s", (code, expected) => {
    expect(isSliceCall(firstExpression(code))).toBe(expected);
  });
});

describe("getSliceArgs", () => {
  it("returns both args when present", () => {
    const { end, start } = getSliceArguments(sliceCall("arr.slice(0, 2)"));
    expect(start?.type).toBe("Literal");
    expect(end?.type).toBe("Literal");
  });

  it("returns end null when only one arg", () => {
    const { end, start } = getSliceArguments(sliceCall("arr.slice(-2)"));
    expect(start?.type).toBe("UnaryExpression");
    expect(end).toBeNull();
  });

  it("returns both null when no args", () => {
    const { end, start } = getSliceArguments(sliceCall("arr.slice()"));
    expect(start).toBeNull();
    expect(end).toBeNull();
  });

  it("returns null for a spread argument", () => {
    const { start } = getSliceArguments(sliceCall("arr.slice(...rest)"));
    expect(start).toBeNull();
  });
});

describe("classifyTakeShape", () => {
  it.each([
    // [code, expected shape]
    ["arr.slice(0, 3)", { countNode: true, kind: "take" }],
    ["arr.slice(0, n)", { countNode: true, kind: "take" }],
    ["arr.slice(-2)", { countNode: true, kind: "takeRight" }],
    ["arr.slice(-n)", { countNode: true, kind: "takeRight" }],
    ["arr.slice(-0)", null],
    ["arr.slice(1)", null],
    ["arr.slice(1, 3)", null],
    ["arr.slice(-1, 2)", null],
    ["arr.slice()", null],
    ["arr.slice(n)", null],
    ["arr.slice(0, 2, 3)", null],
    ['arr.slice("0", "2")', null],
    ["arr.slice(0 + 1, 2)", null]
  ])("%s → %s", (code, expected) => {
    const shape = classifyTakeShape(sliceCall(code));
    if (null === expected) {
      expect(shape).toBeNull();
      return;
    }
    expect(shape).not.toBeNull();
    expect(shape?.kind).toBe(expected.kind);
    expect(shape?.countNode).toBeTruthy();
  });
});

describe("detectTakePattern", () => {
  it("detects a take shape with receiver", () => {
    const match = detectTakePattern(sliceCall("arr.slice(0, 3)"));
    expect(match).not.toBeNull();
    expect(match?.kind).toBe("take");
    expect(match?.countNode).toBeTruthy();
    expect(match?.receiver.name).toBe("arr");
  });

  it("detects a takeRight shape", () => {
    const match = detectTakePattern(sliceCall("arr.slice(-2)"));
    expect(match?.kind).toBe("takeRight");
    expect(match?.countNode).toBeTruthy();
  });

  it("returns null for non-slice calls", () => {
    expect(detectTakePattern(firstExpression("arr.splice(0, 2)"))).toBeNull();
  });

  it("returns null for out-of-scope slice shapes", () => {
    expect(detectTakePattern(sliceCall("arr.slice(1)"))).toBeNull();
  });
});

describe("formatTakeCall", () => {
  it.each([
    ["take", "arr", "3", "take(arr, 3)"],
    ["takeRight", "xs", "2", "takeRight(xs, 2)"]
  ] as const)(
    "%s(%s, %s) → %s",
    (kind: TakeKind, receiver, count, expected) => {
      expect(formatTakeCall(kind, receiver, count)).toBe(expected);
    }
  );
});

// `getProgram` walks `.parent` up to the Program root. Exercise that path
// through the live rule fixer to confirm it links correctly at runtime.
describe("getProgram (via live fixer)", () => {
  it("resolves the Program and detects a take shape", () => {
    const program = parseProgram("arr.slice(0, 2);");
    linkParents(program);
    const statement = program.body[0];
    if (!statement || AST_NODE_TYPES.ExpressionStatement !== statement.type) {
      throw new Error("expected expression statement");
    }
    const match = detectTakePattern(statement.expression);
    expect(match).not.toBeNull();
  });
});
