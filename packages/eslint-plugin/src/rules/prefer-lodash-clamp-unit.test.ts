import { parseForESLint } from "@typescript-eslint/parser";
import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";
import { describe, expect, it } from "vitest";

import { findCall, linkParents } from "./.fixture.ts";
import {
  buildClampFix,
  detectClampPattern,
  formatClampCall,
  getClampArgumentExpressions,
  isInsideMathMinMaxCall,
  isMathMaxCall,
  isMathMemberCall,
  isMathMinCall,
  isNestedMathCall,
  readInnerCall,
  tryShape
} from "./prefer-lodash-clamp.ts";

const CLAMP_CALL = "clamp(";
const MATH_MIN = "Math.min";
const MATH_MAX = "Math.max";
const MIN_CALL_MEMBER = `${MATH_MIN};`;
const MIN_OF_MAX = `${MATH_MIN}(10, ${MATH_MAX}(0, x));`;
const EXPECTED_CLAMP = "clamp(x, 0, 10)";
const IS_EXPECTED_FALSE = false;
const TEST_NAME = "returns %s for %s as %s";
const MIN_OF_X = `${MATH_MIN}(0, x);`;
const NON_CALL_TITLE = "returns false for non-call expressions";

const parseExpression = (code: string) => {
  const program = parseForESLint(`${code};`, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;
  linkParents(program);
  for (const node of program.body) {
    if (AST_NODE_TYPES.ExpressionStatement !== node.type) {
      continue;
    }
    return node.expression;
  }
  throw new Error(`no expression statement found in: ${code}`);
};

const parseCallExpression = (code: string) => {
  const expression = parseExpression(code);
  if (AST_NODE_TYPES.CallExpression !== expression.type) {
    throw new Error(`expected call expression in: ${code}`);
  }
  return expression;
};

const getCallArguments = (code: string) => {
  const call = parseCallExpression(code);
  return { argumentList: call.arguments, callee: call.callee };
};

const parseMemberExpression = (code: string) => {
  const expression = parseExpression(code);
  if (AST_NODE_TYPES.MemberExpression !== expression.type) {
    throw new Error(`expected member expression in: ${code}`);
  }
  return expression;
};

describe("isMathMemberCall", () => {
  it.each([
    [MATH_MIN, "min", true],
    [MATH_MAX, "max", true],
    ["Math.floor", "floor", true],
    ["myMath.min", "min", false],
    ["Math['min']", "min", false],
    ["Math", "min", false],
    ["math.min", "min", false]
  ] as const)("returns %s for %s as %s", (code, method, expected) => {
    const expression = parseExpression(`${code};`);
    expect(isMathMemberCall(expression, method)).toBe(expected);
  });

  it("returns false for non-member expressions", () => {
    const identifier = parseExpression("Math;") as TSESTree.Identifier;
    expect(isMathMemberCall(identifier, "min")).toBe(false);
  });

  it("returns false when the member receiver is not an identifier", () => {
    const member = parseMemberExpression("foo.Math.min;");
    expect(isMathMemberCall(member, "min")).toBe(false);
  });

  it("returns false when the member property is not an identifier", () => {
    const member = parseMemberExpression("Math['min'];");
    expect(isMathMemberCall(member, "min")).toBe(false);
  });

  it("returns false for a private member property", () => {
    const { call } = findCall(
      "class Math { static #min() {} static run() { Math.#min(); } }"
    );
    expect(isMathMemberCall(call.callee, "min")).toBe(false);
  });
});

describe("isMathMinCall", () => {
  it.each([
    [MIN_OF_X, true],
    [`${MATH_MAX}(0, x);`, false],
    ["Math['min'](0, x);", false],
    ["x.min(0, y);", false]
  ] as const)(TEST_NAME, (code, expected) => {
    expect(isMathMinCall(parseCallExpression(code))).toBe(expected);
  });

  it(NON_CALL_TITLE, () => {
    const member = parseMemberExpression(MIN_CALL_MEMBER);
    expect(isMathMinCall(member as unknown as TSESTree.CallExpression)).toBe(
      IS_EXPECTED_FALSE
    );
  });
});

describe("isMathMaxCall", () => {
  it.each([
    [`${MATH_MAX}(0, x);`, true],
    [MIN_OF_X, false],
    ["Math['max'](0, x);", false],
    ["x.max(0, y);", false]
  ] as const)(TEST_NAME, (code, expected) => {
    expect(isMathMaxCall(parseCallExpression(code))).toBe(expected);
  });

  it(NON_CALL_TITLE, () => {
    const member = parseMemberExpression(`${MATH_MAX};`);
    expect(isMathMaxCall(member as unknown as TSESTree.CallExpression)).toBe(
      false
    );
  });
});

describe("readInnerCall", () => {
  it("returns null when the inner bound is a spread element", () => {
    const innerCall = parseCallExpression(`${MATH_MAX}(...values, x);`);
    expect(readInnerCall(innerCall, "max")).toBeNull();
  });

  it("returns null when the inner value is a nested Math call", () => {
    const innerCall = parseCallExpression(
      `${MATH_MAX}(lower, ${MATH_MIN}(0, x));`
    );
    expect(readInnerCall(innerCall, "max")).toBeNull();
  });
});

describe("tryShape", () => {
  it("returns null when the outer bound is a spread element", () => {
    const { argumentList, callee } = getCallArguments(
      `${MATH_MIN}(...bounds, ${MATH_MAX}(0, x));`
    );
    expect(
      tryShape(callee, argumentList, {
        innerIndex: 1,
        innerKind: "max",
        outerKind: "min"
      })
    ).toBeNull();
  });

  it("returns null when the inner argument is missing", () => {
    const { argumentList, callee } = getCallArguments(`${MATH_MIN}(upper);`);
    expect(
      tryShape(callee, argumentList, {
        innerIndex: 1,
        innerKind: "max",
        outerKind: "min"
      })
    ).toBeNull();
  });
});

describe("getClampArgumentExpressions", () => {
  it.each([
    ["Math.min(upper, Math.max(lower, x));", true],
    ["Math.min(Math.max(lower, x), upper);", true],
    ["Math.max(lower, Math.min(upper, x));", true],
    ["Math.max(Math.min(upper, x), lower);", true],
    ["Math.min(upper, Math.max(lower, x) + 1);", false],
    ["Math.min(Math.max(lower, x));", false],
    ["Math.min(upper, lower);", false],
    ["Math.max(upper, lower);", false],
    ["myMath.min(upper, Math.max(lower, x));", false],
    ["Math['min'](upper, Math.max(lower, x));", false],
    ["Math.min(upper, lower, extra);", false],
    ["Math.min(...values);", false]
  ] as const)("matches %s as %s", (code, expected) => {
    expect(!isNil(getClampArgumentExpressions(parseCallExpression(code)))).toBe(
      expected
    );
  });

  it("returns null for non-call nodes", () => {
    const identifier = parseExpression("Math;") as TSESTree.Identifier;
    expect(
      getClampArgumentExpressions(
        identifier as unknown as TSESTree.CallExpression
      )
    ).toBeNull();
  });

  it("returns null when inner is not a direct Math.max/min call", () => {
    expect(
      getClampArgumentExpressions(parseCallExpression("Math.min(0, x + 1);"))
    ).toBeNull();
  });
});

describe("detectClampPattern", () => {
  it.each([
    ["Math.min(upper, Math.max(lower, x));", true],
    ["Math.min(Math.max(lower, x), upper);", true],
    ["Math.max(lower, Math.min(upper, x));", true],
    ["Math.max(Math.min(upper, x), lower);", true],
    ["Math.min(0, x);", false],
    ["Math.max(0, x, y);", false],
    ["Math.floor(Math.abs(x));", false]
  ] as const)("detects %s as %s", (code, expected) => {
    expect(!isNil(detectClampPattern(parseCallExpression(code)))).toBe(
      expected
    );
  });

  it("returns null for non-call nodes", () => {
    const identifier = parseExpression("x;") as TSESTree.Identifier;
    expect(
      detectClampPattern(identifier as unknown as TSESTree.CallExpression)
    ).toBeNull();
  });
});

describe("formatClampCall", () => {
  it("formats with identifier value and identifier bounds", () => {
    expect(formatClampCall("x", "0", "10")).toBe(EXPECTED_CLAMP);
  });

  it("formats with arbitrary expressions", () => {
    expect(formatClampCall("compute()", "MIN", "MAX")).toBe(
      "clamp(compute(), MIN, MAX)"
    );
  });
});

describe("isNestedMathCall", () => {
  it.each([
    ["Math.min(0, x);", true],
    ["Math.max(0, x);", true],
    ["Math.floor(x);", false]
  ] as const)(TEST_NAME, (code, expected) => {
    expect(isNestedMathCall(parseCallExpression(code))).toBe(expected);
  });

  it(NON_CALL_TITLE, () => {
    expect(
      isNestedMathCall(parseExpression("Math.min;") as TSESTree.Node)
    ).toBe(false);
  });
});

describe("isInsideMathMinMaxCall", () => {
  it("returns false for top-level calls without Math.min/max ancestors", () => {
    expect(isInsideMathMinMaxCall(parseCallExpression(MIN_OF_MAX))).toBe(false);
  });

  it("returns true for Math.min/max calls nested inside another Math.min/max", () => {
    const outerCall = parseCallExpression(
      `${MATH_MIN}(10, ${MATH_MAX}(0, ${MATH_MIN}(5, x)));`
    );
    const nestedCall = outerCall.arguments[1] as TSESTree.CallExpression;
    const innerNestedCall = nestedCall.arguments[1] as TSESTree.CallExpression;
    expect(isInsideMathMinMaxCall(innerNestedCall)).toBe(true);
  });
});

describe("buildClampFix", () => {
  const buildFix = (code: string) => {
    const call = parseCallExpression(code);
    const match = detectClampPattern(call);
    if (!match) {
      throw new Error(`no clamp pattern in: ${code}`);
    }
    const fixer = {
      insertTextBefore: (node: TSESTree.Node, text: string) => {
        return { range: [node.range[0], node.range[0]] as const, text };
      },
      replaceText: (node: TSESTree.Node, text: string) => {
        return { range: node.range, text };
      },
      replaceTextRange: (range: TSESTree.Range, text: string) => {
        return { range, text };
      }
    } as unknown as TSESLint.RuleFixer;
    return buildClampFix(fixer, call, match, code);
  };

  it("produces a replacement over the entire call expression", () => {
    const [first] = buildFix(MIN_OF_MAX);
    expect(first).toEqual({
      range: expect.any(Array),
      text: expect.stringContaining(CLAMP_CALL)
    });
  });

  it.each([
    { expected: EXPECTED_CLAMP, input: MIN_OF_MAX },
    { expected: EXPECTED_CLAMP, input: "Math.min(Math.max(0, x), 10);" },
    { expected: EXPECTED_CLAMP, input: "Math.max(0, Math.min(10, x));" },
    { expected: EXPECTED_CLAMP, input: "Math.max(Math.min(10, x), 0);" },
    {
      expected: "clamp(score, MIN, MAX)",
      input: "Math.min(MAX, Math.max(MIN, score));"
    }
  ])("preserves the order: $input => clamp", ({ expected, input }) => {
    const [first] = buildFix(input);
    expect(first.text).toBe(expected);
  });

  it("includes the disable-comment fix for the umbrella rule", () => {
    const fixes = buildFix(MIN_OF_MAX);
    expect(fixes).toHaveLength(2);
    const [replace, disable] = fixes;
    expect(replace.text).toContain(CLAMP_CALL);
    expect(disable.text).toContain("@ethang/prefer-lodash");
  });
});
