import { parseForESLint } from "@typescript-eslint/parser";
import {
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findCall, linkParents } from "./.fixture.ts";
import {
  buildEscapeRegexpFix,
  detectEscapeRegexpPattern,
  hasCharacterClass,
  hasGlobalFlag,
  isEscapeReplacement,
  isReplaceCall
} from "./prefer-lodash-escape-regexp.ts";

const parseExpression = (code: string) => {
  const source = code.endsWith(";") ? code : `${code};`;
  const program = parseForESLint(source, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;
  linkParents(program);
  for (const node of program.body) {
    if (AST_NODE_TYPES.ExpressionStatement !== node.type) {
      continue;
    }
    return { expression: node.expression, source };
  }
  throw new Error(`no expression statement found in: ${code}`);
};

const parseCallExpression = (code: string) => {
  const { expression, source } = parseExpression(code);
  if (AST_NODE_TYPES.CallExpression !== expression.type) {
    throw new Error(`expected call expression in: ${code}`);
  }
  return { call: expression, source };
};

describe("isReplaceCall", () => {
  it("returns true for .replace() calls", () => {
    const { call } = parseCallExpression("str.replace(/x/, 'y');");
    expect(isReplaceCall(call)).toBe(true);
  });

  it.each([
    ["non-replace method calls", "str.match(/x/);"],
    ["computed property access", "str['replace'](/x/, 'y');"],
    ["non-call expressions", "str.replace;"],
    ["direct function calls", "replace(str, /x/, 'y');"]
  ])("returns false for %s", (_, code) => {
    const { expression } = parseExpression(code);
    expect(isReplaceCall(expression)).toBe(false);
  });

  it("returns false for non-identifier property (private field)", () => {
    const { call } = findCall(
      "class Foo { static #replace() {} static run() { Foo.#replace(/x/, 'y'); } }"
    );
    expect(isReplaceCall(call)).toBe(false);
  });
});

describe("hasCharacterClass", () => {
  it.each([
    ["/[a-z]/g;", true],
    ["/foo/g;", false],
    [String.raw`/[\\^$*+?.()|[\]{}]/g;`, true]
  ])("returns %s for pattern %s", (code, expected) => {
    const { expression } = parseExpression(code);
    const regex = expression as TSESTree.Literal;
    expect(hasCharacterClass(regex)).toBe(expected);
  });
});

describe("hasGlobalFlag", () => {
  it.each([
    ["/[a-z]/g;", true],
    ["/[a-z]/;", false],
    ["/[a-z]/gi;", true],
    ["/[a-z]/i;", false]
  ])("returns %s for pattern %s", (code, expected) => {
    const { expression } = parseExpression(code);
    const regex = expression as TSESTree.Literal;
    expect(hasGlobalFlag(regex)).toBe(expected);
  });
});

describe("isEscapeReplacement", () => {
  it.each([
    [String.raw`'\\$&';`, true],
    [String.raw`'\\$0';`, true],
    ["'replacement';", false]
  ])("returns %s for literal %s", (code, expected) => {
    const { expression } = parseExpression(code);
    const literal = expression as TSESTree.Literal;
    expect(isEscapeReplacement(literal)).toBe(expected);
  });

  it("returns false for non-literal nodes", () => {
    const { expression } = parseExpression("replacer;");
    const identifier = expression as TSESTree.Identifier;
    expect(isEscapeReplacement(identifier)).toBe(false);
  });

  it("returns false for non-string literals", () => {
    const { expression } = parseExpression("42;");
    const numberLiteral = expression as TSESTree.Literal;
    expect(isEscapeReplacement(numberLiteral)).toBe(false);
  });
});

describe("detectEscapeRegexpPattern", () => {
  it("detects the canonical escape pattern", () => {
    const { call } = parseCallExpression(
      String.raw`str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');`
    );
    const match = detectEscapeRegexpPattern(call);
    expect(match).not.toBeNull();
    expect(match?.stringExpr.type).toBe(AST_NODE_TYPES.Identifier);
    expect((match?.stringExpr as TSESTree.Identifier).name).toBe("str");
  });

  it.each([
    [
      "returns null when replace has no character class",
      String.raw`str.replace(/foo/g, '\\$&');`
    ],
    [
      "returns null when regex lacks global flag",
      String.raw`str.replace(/[\\^$*+?.()|[\]{}]/, '\\$&');`
    ],
    [
      "returns null when replacement is not an escape backreference",
      "str.replace(/[<>]/g, 'replacement');"
    ],
    [
      "returns null when first argument is not a regex literal",
      String.raw`str.replace(regex, '\\$&');`
    ],
    ["returns null when second argument is missing", "str.replace(/[<>]/g);"],
    ["returns null for non-replace calls", "str.match(/[<>]/g);"]
  ])("%s", (_, code) => {
    const { call } = parseCallExpression(code);
    expect(detectEscapeRegexpPattern(call)).toBeNull();
  });

  it("returns null for non-call nodes", () => {
    const { expression } = parseExpression("str;");
    const identifier = expression as TSESTree.Identifier;
    expect(
      detectEscapeRegexpPattern(
        identifier as unknown as TSESTree.CallExpression
      )
    ).toBeNull();
  });

  it("handles expression string sources", () => {
    const { call } = parseCallExpression(
      String.raw`getStr().replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');`
    );
    const match = detectEscapeRegexpPattern(call);
    expect(match).not.toBeNull();
    expect(match?.stringExpr.type).toBe(AST_NODE_TYPES.CallExpression);
  });
});

describe("buildEscapeRegexpFix", () => {
  const buildFix = (code: string) => {
    const { call, source } = parseCallExpression(code);
    const match = detectEscapeRegexpPattern(call);
    if (!match) {
      throw new Error(`no escapeRegexp pattern in: ${code}`);
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
    return buildEscapeRegexpFix(fixer, match, source);
  };

  it("produces escapeRegExp replacement", () => {
    const fixes = buildFix(
      String.raw`str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');`
    );
    const first = fixes[0];
    if (!first) {
      throw new Error("expected first fix");
    }
    expect(first.text).toBe("escapeRegExp(str)");
  });

  it("preserves expression string sources", () => {
    const fixes = buildFix(
      String.raw`getStr().replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');`
    );
    const first = fixes[0];
    if (!first) {
      throw new Error("expected first fix");
    }
    expect(first.text).toBe("escapeRegExp(getStr())");
  });

  it("includes the disable-comment fix for the umbrella rule", () => {
    const fixes = buildFix(
      String.raw`str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');`
    );
    expect(fixes).toHaveLength(2);
    const [replace, disable] = fixes;
    if (!replace || !disable) {
      throw new Error("expected two fixes");
    }
    expect(replace.text).toContain("escapeRegExp");
    expect(disable.text).toContain("@ethang/prefer-lodash");
  });
});
