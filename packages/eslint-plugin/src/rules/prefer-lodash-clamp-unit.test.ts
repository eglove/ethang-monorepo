import { parseForESLint } from "@typescript-eslint/parser";
import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import isNil from "lodash/isNil.js";
import { describe, expect, it } from "vitest";

import {
  buildClampFix,
  detectClampPattern,
  formatClampCall,
  getClampArgumentExpressions,
  isMathMaxCall,
  isMathMemberCall,
  isMathMinCall
} from "./prefer-lodash-clamp.ts";

const CLAMP_CALL = "clamp(";
const MIN_OF_MAX = "Math.min(10, Math.max(0, x));";
const EXPECTED_CLAMP = "clamp(x, 0, 10)";
const TEST_NAME = "returns %s for %s as %s";
const MIN_OF_X = "Math.min(0, x);";

const parseExpression = (code: string) => {
  const program = parseForESLint(`${code};`, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;
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

const parseMemberExpression = (code: string) => {
  const expression = parseExpression(code);
  if (AST_NODE_TYPES.MemberExpression !== expression.type) {
    throw new Error(`expected member expression in: ${code}`);
  }
  return expression;
};

describe("isMathMemberCall", () => {
  it.each([
    ["Math.min", true],
    ["Math.max", true],
    ["Math.floor", true],
    ["myMath.min", false],
    ["Math['min']", false],
    ["Math", false],
    ["math.min", false]
  ] as const)(TEST_NAME, (code, expected) => {
    const expression = parseExpression(`${code};`);
    expect(isMathMemberCall(expression, code.split(".", 2)[1] ?? "")).toBe(
      expected
    );
  });

  it("returns false for non-member expressions", () => {
    const identifier = parseExpression("Math;") as TSESTree.Identifier;
    expect(isMathMemberCall(identifier, "min")).toBe(false);
  });
});

describe("isMathMinCall", () => {
  it.each([
    [MIN_OF_X, true],
    ["Math.max(0, x);", false],
    ["Math['min'](0, x);", false],
    ["x.min(0, y);", false]
  ] as const)(TEST_NAME, (code, expected) => {
    expect(isMathMinCall(parseCallExpression(code))).toBe(expected);
  });

  it("returns false for non-call expressions", () => {
    const member = parseMemberExpression("Math.min;");
    expect(isMathMinCall(member as unknown as TSESTree.CallExpression)).toBe(
      false
    );
  });
});

describe("isMathMaxCall", () => {
  it.each([
    ["Math.max(0, x);", true],
    [MIN_OF_X, false],
    ["Math['max'](0, x);", false],
    ["x.max(0, y);", false]
  ] as const)(TEST_NAME, (code, expected) => {
    expect(isMathMaxCall(parseCallExpression(code))).toBe(expected);
  });

  it("returns false for non-call expressions", () => {
    const member = parseMemberExpression("Math.max;");
    expect(isMathMaxCall(member as unknown as TSESTree.CallExpression)).toBe(
      false
    );
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
    ["Math.min(upper, lower, extra);", false]
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

  it("preserves the order: Math.min(upper, Math.max(lower, x)) => clamp(x, lower, upper)", () => {
    const [first] = buildFix(MIN_OF_MAX);
    expect(first.text).toBe(EXPECTED_CLAMP);
  });

  it("preserves the order: Math.min(Math.max(lower, x), upper) => clamp(x, lower, upper)", () => {
    const [first] = buildFix("Math.min(Math.max(0, x), 10);");
    expect(first.text).toBe(EXPECTED_CLAMP);
  });

  it("preserves the order: Math.max(lower, Math.min(upper, x)) => clamp(x, lower, upper)", () => {
    const [first] = buildFix("Math.max(0, Math.min(10, x));");
    expect(first.text).toBe(EXPECTED_CLAMP);
  });

  it("preserves the order: Math.max(Math.min(upper, x), lower) => clamp(x, lower, upper)", () => {
    const [first] = buildFix("Math.max(Math.min(10, x), 0);");
    expect(first.text).toBe(EXPECTED_CLAMP);
  });

  it("handles expression operands", () => {
    const [first] = buildFix("Math.min(MAX, Math.max(MIN, score));");
    expect(first.text).toBe("clamp(score, MIN, MAX)");
  });

  it("includes the disable-comment fix for the umbrella rule", () => {
    const fixes = buildFix(MIN_OF_MAX);
    expect(fixes).toHaveLength(2);
    const [replace, disable] = fixes;
    expect(replace.text).toContain(CLAMP_CALL);
    expect(disable.text).toContain("@ethang/prefer-lodash");
  });
});
