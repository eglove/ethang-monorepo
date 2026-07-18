import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { firstExpression, linkParents, parseProgram } from "./.fixture.ts";
import {
  classifySliceShape,
  detectSlicePattern,
  formatSliceCall,
  getNegativeCountText,
  getSliceArguments,
  isSliceCall,
  isStringType,
  stringText
} from "./prefer-lodash-slice.ts";

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

describe("classifySliceShape", () => {
  it.each([
    // [code, expected shape]
    ["arr.slice(0, 3)", { end: true, start: true }],
    ["arr.slice(0, n)", { end: true, start: true }],
    ["arr.slice(-2)", { end: false, start: true }],
    ["arr.slice(-n)", { end: false, start: true }],
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
    const shape = classifySliceShape(sliceCall(code));
    if (null === expected) {
      expect(shape).toBeNull();
      return;
    }
    expect(shape).not.toBeNull();
    expect(null !== shape?.endNode).toBe(expected.end);
    expect(null !== shape?.startNode).toBe(expected.start);
  });
});

describe("detectSlicePattern", () => {
  it("detects a prefix shape with receiver", () => {
    const match = detectSlicePattern(sliceCall("arr.slice(0, 3)"));
    expect(match).not.toBeNull();
    expect(match?.endNode).not.toBeNull();
    expect(match?.startNode).not.toBeNull();
    expect(match?.receiver.name).toBe("arr");
  });

  it("detects a suffix shape", () => {
    const match = detectSlicePattern(sliceCall("arr.slice(-2)"));
    expect(match?.endNode).toBeNull();
    expect(match?.startNode).not.toBeNull();
  });

  it("returns null for non-slice calls", () => {
    expect(detectSlicePattern(firstExpression("arr.splice(0, 2)"))).toBeNull();
  });

  it("returns null for out-of-scope slice shapes", () => {
    expect(detectSlicePattern(sliceCall("arr.slice(1)"))).toBeNull();
  });
});

describe("formatSliceCall", () => {
  it.each([
    ["arr", "0", "3", "slice(arr, 0, 3)"],
    ["xs", "-2", "", "slice(xs, -2)"]
  ] as const)("slice(%s, %s, %s) → %s", (receiver, start, end, expected) => {
    expect(formatSliceCall(receiver, start, end)).toBe(expected);
  });
});

describe("getNegativeCountText", () => {
  it.each([
    ["-2", "2"],
    ["-n", "n"],
    ["-(2 + 1)", null],
    ["-foo.bar", null],
    ["+2", null],
    ["2", null]
  ])("%s → %s", (code, expected) => {
    expect(getNegativeCountText(firstExpression(code))).toBe(expected);
  });
});

// `getProgram` walks `.parent` up to the Program root. Exercise that path
// through the live rule fixer to confirm it links correctly at runtime.
describe("getProgram (via live fixer)", () => {
  it("resolves the Program and detects a slice shape", () => {
    const program = parseProgram("arr.slice(0, 2);");
    linkParents(program);
    const statement = program.body[0];
    if (!statement || AST_NODE_TYPES.ExpressionStatement !== statement.type) {
      throw new Error("expected expression statement");
    }
    const match = detectSlicePattern(statement.expression);
    expect(match).not.toBeNull();
  });
});

describe("stringText", () => {
  it.each([
    ["string", true],
    ['"hello"', true],
    ["'hello'", true],
    ["`hello`", true],
    ["number", false],
    ["", false]
  ])("%s → %s", (text, expected) => {
    expect(stringText(text)).toBe(expected);
  });
});

// `isStringType` reads the receiver's type via the linter's parser services.
// Each case builds a minimal `context` so the defensive branches of
// `getNodeType` (untyped runs, projectService mode, type resolution errors)
// and the union branch of `isStringType` are all exercised.
describe("isStringType", () => {
  const node = sliceCall('"hello".slice(0, 2)');

  const contextWith = (parserServices: Record<string, unknown>) => {
    return { sourceCode: { parserServices } };
  };

  it("returns true for a string type via projectService getTypeAtLocation", () => {
    const context = contextWith({
      getTypeAtLocation: () => {
        return {
          isUnion: () => {
            return false;
          }
        };
      },
      program: {
        getTypeChecker: () => {
          return {
            typeToString: () => {
              return "string";
            }
          };
        }
      }
    });
    expect(isStringType(node, context as never)).toBe(true);
  });

  it("returns false when parser services are absent", () => {
    expect(isStringType(node, contextWith({}) as never)).toBe(false);
  });

  it("returns false when getTypeAtLocation throws", () => {
    const context = contextWith({
      getTypeAtLocation: () => {
        throw new Error("no types");
      }
    });
    expect(isStringType(node, context as never)).toBe(false);
  });

  it("returns false when type resolution via map/program throws", () => {
    const context = contextWith({
      esTreeNodeToTSNodeMap: new Map(),
      program: {
        getTypeChecker: () => {
          return {
            getTypeAtLocation: () => {
              throw new Error("boom");
            }
          };
        }
      }
    });
    expect(isStringType(node, context as never)).toBe(false);
  });

  it("returns true for a union type that contains a string member", () => {
    const unionNode = {
      isUnion: () => {
        return true;
      },
      types: [
        {
          isUnion: () => {
            return false;
          }
        },
        {
          isUnion: () => {
            return false;
          }
        }
      ]
    } as unknown as Parameters<typeof isStringType>[0];
    const unionContext = contextWith({
      esTreeNodeToTSNodeMap: new Map(),
      program: {
        getTypeChecker: () => {
          return {
            getTypeAtLocation: () => {
              return unionNode;
            },
            typeToString: (type: unknown) => {
              const { types } = unionNode as { types: unknown[] };
              return type === types[1] ? '"world"' : "number";
            }
          };
        }
      }
    });
    expect(isStringType(node, unionContext as never)).toBe(true);
  });
});
