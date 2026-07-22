import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";
import { describe, expect, it } from "vitest";

import { firstExpression, linkParents, parseProgram } from "./.fixture.ts";
import {
  classifySliceShape,
  detectSlicePattern,
  formatSliceCall,
  getNegativeCountText,
  getSliceArguments,
  isSliceCall,
  isStringText,
  isStringType
} from "./prefer-lodash-slice.ts";

// Literal test fixtures that repeat across `it.each` tables. sonar's
// `no-duplicate-string` rule flags the same literal appearing multiple times,
// so they are hoisted to named constants.
const EMPTY_STRING = "";
const STRING_TYPE = "string";
const ARR_SLICE_0_2 = "arr.slice(0, 2)";
const ARR_SLICE_NEG2 = "arr.slice(-2)";
const ARR_SLICE_EMPTY = "arr.slice()";
const ARR_SLICE_0_3 = "arr.slice(0, 3)";
const ARR_SPLICE_0_2 = "arr.splice(0, 2)";
const ARR_SLICE_1 = "arr.slice(1)";

const sliceCall = (code: string) => {
  const node = firstExpression(code);
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    throw new Error("expected a call expression");
  }
  return node;
};

describe("isSliceCall", () => {
  it.each([
    [ARR_SLICE_0_2, true],
    [ARR_SLICE_NEG2, true],
    [ARR_SLICE_EMPTY, true],
    ["foo()", false],
    ['arr["slice"](0, 2)', false],
    [ARR_SPLICE_0_2, false],
    ["obj.foo(0, 2)", false],
    ["get().slice(0, 2)", false],
    ["slice(0, 2)", false],
    ["arr[0]", false]
  ])("%s → %s", (code, expected) => {
    expect(isSliceCall(firstExpression(code))).toBe(expected);
  });
});

describe("getSliceArgs", () => {
  it("returns both args when present", () => {
    const { end, start } = getSliceArguments(sliceCall(ARR_SLICE_0_2));
    expect(start?.type).toBe("Literal");
    expect(end?.type).toBe("Literal");
  });

  it("returns end null when only one arg", () => {
    const { end, start } = getSliceArguments(sliceCall(ARR_SLICE_NEG2));
    expect(start?.type).toBe("UnaryExpression");
    expect(end).toBeNull();
  });

  it("returns both null when no args", () => {
    const { end, start } = getSliceArguments(sliceCall(ARR_SLICE_EMPTY));
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
    [ARR_SLICE_0_3, { end: true, start: true }],
    ["arr.slice(0, n)", { end: true, start: true }],
    [ARR_SLICE_NEG2, { end: false, start: true }],
    ["arr.slice(-n)", { end: false, start: true }],
    ["arr.slice(-0)", null],
    [ARR_SLICE_1, null],
    ["arr.slice(1, 3)", null],
    ["arr.slice(-1, 2)", null],
    [ARR_SLICE_EMPTY, null],
    ["arr.slice(n)", null],
    ["arr.slice(0, 2, 3)", null],
    ['arr.slice("0", "2")', null],
    ["arr.slice(0 + 1, 2)", null]
  ])("%s → %s", (code, expected) => {
    const shape = classifySliceShape(sliceCall(code));
    if (isNil(expected)) {
      expect(shape).toBeNull();
      return;
    }
    expect(shape).not.toBeNull();
    expect(!isNil(shape?.endNode)).toBe(expected.end);
    expect(!isNil(shape?.startNode)).toBe(expected.start);
  });
});

describe("detectSlicePattern", () => {
  it("detects a prefix shape with receiver", () => {
    const match = detectSlicePattern(sliceCall(ARR_SLICE_0_3));
    expect(match).not.toBeNull();
    const { endNode, startNode } = match ?? {};
    expect(endNode).not.toBeNull();
    expect(startNode).not.toBeNull();
    expect(match?.receiver.name).toBe("arr");
  });

  it("detects a suffix shape", () => {
    const match = detectSlicePattern(sliceCall(ARR_SLICE_NEG2));
    expect(match?.endNode).toBeNull();
    expect(match?.startNode).not.toBeNull();
  });

  it("returns null for non-slice calls", () => {
    expect(detectSlicePattern(firstExpression(ARR_SPLICE_0_2))).toBeNull();
  });

  it("returns null for out-of-scope slice shapes", () => {
    expect(detectSlicePattern(sliceCall(ARR_SLICE_1))).toBeNull();
  });
});

describe("formatSliceCall", () => {
  it.each([
    ["arr", "0", "3", "slice(arr, 0, 3)"],
    ["xs", "-2", EMPTY_STRING, "slice(xs, -2)"]
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
    const [statement] = program.body;
    if (AST_NODE_TYPES.ExpressionStatement === statement?.type) {
      const match = detectSlicePattern(statement.expression);
      expect(match).not.toBeNull();
    }
  });
});

describe("stringText", () => {
  it.each([
    [STRING_TYPE, true],
    ['"hello"', true],
    ["'hello'", true],
    ["`hello`", true],
    ["number", false],
    [EMPTY_STRING, false]
  ])("%s → %s", (text, expected) => {
    expect(isStringText(text)).toBe(expected);
  });
});

// `isStringType` reads the receiver's type via the linter's parser services.
// Each case builds a minimal `context` so the defensive branches of
// `getNodeType` (untyped runs, projectService mode, type resolution errors)
// and the union branch of `isStringType` are all exercised.
const stringTypeSliceNode = sliceCall('"hello".slice(0, 2)');

const contextWith = (parserServices: Record<string, unknown>) => {
  return { sourceCode: { parserServices } };
};

describe("isStringType projectService", () => {
  const node = stringTypeSliceNode;

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

  it("returns false when getTypeAtLocation returns a non-conforming shape", () => {
    const context = contextWith({
      getTypeAtLocation: () => {
        return {
          // missing the required `isUnion` method → decode fails → null
          notAType: true
        };
      }
    });
    expect(isStringType(node, context as never)).toBe(false);
  });

  it("returns false when type resolution via map/program yields no checker", () => {
    const context = contextWith({
      esTreeNodeToTSNodeMap: new Map(),
      program: {
        getTypeChecker: () => {
          return {
            // missing `typeToString` → checker decode fails → null
            getTypeAtLocation: () => {
              return {
                isUnion: () => {
                  return false;
                }
              };
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

describe("isStringType classic", () => {
  const node = stringTypeSliceNode;

  it("returns true for a string type via classic esTreeNodeToTSNodeMap", () => {
    const classicContext = contextWith({
      esTreeNodeToTSNodeMap: new Map([[node, node]]),
      program: {
        getTypeChecker: () => {
          return {
            getTypeAtLocation: () => {
              return {
                isUnion: () => {
                  return false;
                }
              };
            },
            typeToString: () => {
              return "string";
            }
          };
        }
      }
    });
    expect(isStringType(node, classicContext as never)).toBe(true);
  });

  it("returns false when classic getTypeAtLocation returns a non-conforming shape", () => {
    const classicContext = contextWith({
      esTreeNodeToTSNodeMap: new Map([[node, node]]),
      program: {
        getTypeChecker: () => {
          return {
            getTypeAtLocation: () => {
              return { notAType: true };
            },
            typeToString: () => {
              return "string";
            }
          };
        }
      }
    });
    expect(isStringType(node, classicContext as never)).toBe(false);
  });

  it("returns false when classic checker lacks getTypeAtLocation", () => {
    const classicContext = contextWith({
      esTreeNodeToTSNodeMap: new Map([[node, node]]),
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
    expect(isStringType(node, classicContext as never)).toBe(false);
  });

  it("returns false when classic program is absent", () => {
    const classicContext = contextWith({
      esTreeNodeToTSNodeMap: new Map([[node, node]])
    });
    expect(isStringType(node, classicContext as never)).toBe(false);
  });

  it("returns false when parser services are not object-like", () => {
    expect(
      isStringType(node, contextWith("not-an-object" as never) as never)
    ).toBe(false);
  });

  it("returns false when projectService getTypeAtLocation returns a non-object", () => {
    const classicContext = contextWith({
      getTypeAtLocation: () => {
        return "not-a-type";
      }
    });
    expect(isStringType(node, classicContext as never)).toBe(false);
  });

  it("returns false when classic getTypeChecker returns a non-object", () => {
    const classicContext = contextWith({
      esTreeNodeToTSNodeMap: new Map([[node, node]]),
      program: {
        getTypeChecker: () => {
          return 42;
        }
      }
    });
    expect(isStringType(node, classicContext as never)).toBe(false);
  });

  it("returns false when projectService program is absent", () => {
    const projectContext = contextWith({
      getTypeAtLocation: () => {
        return {
          isUnion: () => {
            return false;
          }
        };
      }
    });
    expect(isStringType(node, projectContext as never)).toBe(false);
  });

  it("returns false when projectService checker lacks typeToString", () => {
    const projectContext = contextWith({
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
            getTypeAtLocation: () => {
              return {
                isUnion: () => {
                  return false;
                }
              };
            }
          };
        }
      }
    });
    expect(isStringType(node, projectContext as never)).toBe(false);
  });
});
