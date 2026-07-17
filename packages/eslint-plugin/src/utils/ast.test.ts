import type { RuleFixer } from "@typescript-eslint/utils/ts-eslint";

import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { Effect } from "effect";
import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import {
  ensureEffectImport,
  ensureLodashImport,
  getImportedKind,
  isEffectImportedIdentifier,
  isEffectNamespace,
  isEffectSource,
  isLodashCall,
  lodashDeepImport,
  lookupLodashEntry,
  resolveCall,
  resolveMemberExpressionCall
} from "./ast.ts";

const KIND_UNKNOWN_MEMBER = "unknown-member";

const parseProgram = (code: string) => {
  return parseForESLint(code, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;
};

const NOOP_FIX = constant({ range: [0, 0], text: "" } as never);
const FAKE_FIX = constant({ range: [10, 10], text: "" } as never);
const NO_CALL_EXPRESSION_FOUND = "no call expression found in:";
const METHOD_MAP = "map";
const SOURCE_CODE_AST_CONTEXT = (program: TSESTree.Program) => {
  return { sourceCode: { ast: program } };
};

const buildFakeFixer = (overrides: Partial<RuleFixer> = {}) => {
  return {
    insertTextAfter: NOOP_FIX,
    insertTextAfterRange: NOOP_FIX,
    insertTextBefore: NOOP_FIX,
    insertTextBeforeRange: NOOP_FIX,
    remove: NOOP_FIX,
    removeRange: NOOP_FIX,
    replaceText: NOOP_FIX,
    replaceTextRange: NOOP_FIX,
    ...overrides
  };
};

const importedKindOf = (code: string) => {
  const program = parseProgram(code);
  const context = SOURCE_CODE_AST_CONTEXT(program);
  return getImportedKind(context);
};

const firstCallExpression = (code: string) => {
  const program = parseProgram(code);
  for (const node of program.body) {
    if (AST_NODE_TYPES.ExpressionStatement !== node.type) {
      continue;
    }

    const { expression } = node;
    if (AST_NODE_TYPES.CallExpression === expression.type) {
      return { call: expression, program };
    }
  }
  return Effect.runSync(Effect.die(`${NO_CALL_EXPRESSION_FOUND} ${code}`));
};

const IMPORT_KIND_EFFECT = "effect";
const IMPORT_KIND_LODASH = "lodash";
const IMPORT_KIND_NONE = "none";
const KIND_EFFECT_ARRAY = "effect-array";
const LODASH_IMPORT = 'import _ from "lodash";';
const EFFECT_FOO_IMPORT = 'import { foo } from "effect";';
const CONST_X = "const x = 1;";

describe("getImportedKind", () => {
  it.each([
    { code: EFFECT_FOO_IMPORT, expected: IMPORT_KIND_EFFECT },
    {
      code: 'import { foo } from "effect/Array";',
      expected: IMPORT_KIND_EFFECT
    },
    { code: LODASH_IMPORT, expected: IMPORT_KIND_LODASH },
    { code: 'import map from "lodash/map.js";', expected: IMPORT_KIND_LODASH },
    { code: 'import { foo } from "./local.js";', expected: IMPORT_KIND_NONE }
  ])("detects import kind for $code", ({ code, expected }) => {
    expect(importedKindOf(code)).toBe(expected);
  });

  it("returns 'none' when there are no import declarations", () => {
    expect(importedKindOf(CONST_X)).toBe(IMPORT_KIND_NONE);
  });

  it("prefers 'effect' over 'lodash' when both are imported", () => {
    expect(
      importedKindOf(`${LODASH_IMPORT}\nimport { Array } from "effect";`)
    ).toBe(IMPORT_KIND_EFFECT);
  });
});

describe("ensureEffectImport", () => {
  it("returns null when effect is already imported", () => {
    const program = parseProgram(EFFECT_FOO_IMPORT);
    const fixer = buildFakeFixer({ insertTextAfter: NOOP_FIX });
    expect(ensureEffectImport(program, fixer)).toBeNull();
  });

  it("inserts an import at the start when program is empty", () => {
    const calls: string[] = [];
    const program = parseProgram("");
    const fixer = buildFakeFixer({
      insertTextBeforeRange: (range, text) => {
        calls.push(`insertTextBeforeRange:${range[0]}:${text}`);
        return FAKE_FIX();
      }
    });
    const fix = ensureEffectImport(program, fixer);
    expect(fix).toBeDefined();
    expect(calls[0]).toMatch(/^insertTextBeforeRange:0:/u);
  });

  it("inserts an import after the last import declaration", () => {
    const calls: string[] = [];
    const program = parseProgram(
      `import a from "lodash/map.js";\nimport b from "lodash/filter.js";\n${CONST_X}`
    );
    const fixer = buildFakeFixer({
      insertTextAfter: (_node, text) => {
        calls.push(`insertTextAfter:${text}`);
        return FAKE_FIX();
      }
    });
    const fix = ensureEffectImport(program, fixer);
    expect(fix).toBeDefined();
    expect(calls[0]).toBe('insertTextAfter:import { Array } from "effect";\n');
  });

  it("inserts an import before the first node when no imports exist", () => {
    const calls: string[] = [];
    const program = parseProgram(CONST_X);
    const fixer = buildFakeFixer({
      insertTextBefore: (_node, text) => {
        calls.push(`insertTextBefore:${text}`);
        return FAKE_FIX();
      }
    });
    const fix = ensureEffectImport(program, fixer);
    expect(fix).toBeDefined();
    expect(calls[0]).toBe('insertTextBefore:import { Array } from "effect";\n');
  });
});

describe("ensureLodashImport", () => {
  it("returns null when the deep import is already present", () => {
    const program = parseProgram('import map from "lodash/map.js";');
    const fixer = buildFakeFixer({ insertTextAfter: NOOP_FIX });
    expect(ensureLodashImport(program, METHOD_MAP, fixer)).toBeNull();
  });

  it("inserts a deep import after the last import", () => {
    const calls: string[] = [];
    const program = parseProgram('import filter from "lodash/filter.js";');
    const fixer = buildFakeFixer({
      insertTextAfter: (_node, text) => {
        calls.push(`insertTextAfter:${text}`);
        return FAKE_FIX();
      }
    });
    const fix = ensureLodashImport(program, METHOD_MAP, fixer);
    expect(fix).toBeDefined();
    expect(calls[0]).toBe('insertTextAfter:import map from "lodash/map.js";\n');
  });

  it("inserts a deep import before the first node when no imports exist", () => {
    const calls: string[] = [];
    const program = parseProgram(CONST_X);
    const fixer = buildFakeFixer({
      insertTextBefore: (_node, text) => {
        calls.push(`insertTextBefore:${text}`);
        return FAKE_FIX();
      }
    });
    const fix = ensureLodashImport(program, METHOD_MAP, fixer);
    expect(fix).toBeDefined();
    expect(calls[0]).toBe(
      'insertTextBefore:import map from "lodash/map.js";\n'
    );
  });

  it("inserts a deep import at the start when program is empty", () => {
    const calls: string[] = [];
    const program = parseProgram("");
    const fixer = buildFakeFixer({
      insertTextBeforeRange: (range, text) => {
        calls.push(`insertTextBeforeRange:${range[0]}:${text}`);
        return FAKE_FIX();
      }
    });
    const fix = ensureLodashImport(program, METHOD_MAP, fixer);
    expect(fix).toBeDefined();
    expect(calls[0]).toMatch(/^insertTextBeforeRange:0:/u);
  });
});

describe("resolveCall", () => {
  it("resolves an effect Array member call", () => {
    const { call, program } = firstCallExpression(
      'import { Array } from "effect"; Array.map(xs, fn);'
    );
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe(KIND_EFFECT_ARRAY);
    expect(resolved.methodName).toBe(METHOD_MAP);
    expect(resolved.effectImportName).toBe("Array");
  });

  it("resolves an Array$.map call", () => {
    const { call, program } = firstCallExpression("Array$.map(xs, fn);");
    expect(resolveCall(call, program).kind).toBe(KIND_EFFECT_ARRAY);
  });

  it("resolves an Effect member call", () => {
    const { call, program } = firstCallExpression("Effect.succeed(1);");
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe("effect-core");
    expect(resolved.effectImportName).toBe("Effect");
  });

  it("resolves an Effect$ member call", () => {
    const { call, program } = firstCallExpression("Effect$.succeed(1);");
    expect(resolveCall(call, program).kind).toBe("effect-core");
  });

  it("resolves array-literal receivers to 'array'", () => {
    const { call, program } = firstCallExpression("[1, 2, 3].map(fn);");
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe("array");
    expect(resolved.methodName).toBe(METHOD_MAP);
  });

  it("resolves known lodash methods to 'array'", () => {
    const { call, program } = firstCallExpression("xs.chunk(2);");
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe("array");
    expect(resolved.methodName).toBe("chunk");
  });

  it("resolves known effect methods to 'array'", () => {
    const { call, program } = firstCallExpression("xs.groupBy(fn);");
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe("array");
    expect(resolved.methodName).toBe("groupBy");
  });

  it("returns 'unknown-member' for unrelated member calls", () => {
    const { call, program } = firstCallExpression("someObj.weirdMethod();");
    expect(resolveCall(call, program).kind).toBe(KIND_UNKNOWN_MEMBER);
  });

  it("resolves lodash identifier calls to 'lodash'", () => {
    const { call, program } = firstCallExpression("map(xs, fn);");
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe("lodash");
    expect(resolved.lodashImportName).toBe(METHOD_MAP);
  });

  it("resolves effect-array identifier calls to 'effect-array'", () => {
    const { call, program } = firstCallExpression("fromIterable(xs);");
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe(KIND_EFFECT_ARRAY);
    expect(resolved.effectImportName).toBe("Array");
  });

  it("resolves IIFE-style calls to 'other'", () => {
    const { call, program } = firstCallExpression("(function(){})();");
    expect(resolveCall(call, program).kind).toBe("other");
  });

  it("resolves unknown identifier calls to 'other'", () => {
    const { call, program } = firstCallExpression("someUnknownFn();");
    expect(resolveCall(call, program).kind).toBe("other");
  });

  it("resolves computed literal member calls to 'array'", () => {
    const { call, program } = firstCallExpression("xs['map'](fn);");
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe("array");
    expect(resolved.methodName).toBe(METHOD_MAP);
  });

  it("resolves non-string literal member calls to 'unknown-member'", () => {
    const { call, program } = firstCallExpression("xs[123](fn);");
    expect(resolveCall(call, program).kind).toBe(KIND_UNKNOWN_MEMBER);
  });

  it("resolves template literal member calls to 'unknown-member'", () => {
    const { call, program } = firstCallExpression("xs[`map`](fn);");
    expect(resolveCall(call, program).kind).toBe(KIND_UNKNOWN_MEMBER);
  });

  it("resolves chained array method calls to 'array'", () => {
    const { call, program } = firstCallExpression("xs.map(fn).filter(fn);");
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe("array");
    expect(resolved.methodName).toBe("filter");
  });

  it("returns 'unknown-member' for groupBy on a non-array chain", () => {
    const { call, program } = firstCallExpression(
      "database.select().from(table).where(cond).groupBy(table.id);"
    );
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe(KIND_UNKNOWN_MEMBER);
    expect(resolved.methodName).toBe("groupBy");
  });

  it("returns 'unknown-member' for orderBy on a non-array chain", () => {
    const { call, program } = firstCallExpression(
      "database.select().from(table).orderBy(table.col);"
    );
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe(KIND_UNKNOWN_MEMBER);
  });

  it("resolves array method on unknown function return to 'array'", () => {
    const { call, program } = firstCallExpression(
      "getArray().map(fn).filter(fn);"
    );
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe("array");
    expect(resolved.methodName).toBe("filter");
  });

  it("returns 'unknown-member' for computed access with a variable", () => {
    const { call, program } = firstCallExpression(
      "const method = 'map'; obj[method](1);"
    );
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe(KIND_UNKNOWN_MEMBER);
  });

  it("returns 'unknown-member' for CSS.escape()", () => {
    const { call, program } = firstCallExpression("CSS.escape('foo');");
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe(KIND_UNKNOWN_MEMBER);
  });

  it("returns 'unknown-member' for performance.now()", () => {
    const { call, program } = firstCallExpression("performance.now();");
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe(KIND_UNKNOWN_MEMBER);
    expect(resolved.methodName).toBe("now");
  });

  it("returns 'unknown-member' for Buffer.concat()", () => {
    const { call, program } = firstCallExpression(
      'import { Buffer } from "node:buffer"; Buffer.concat(chunks);'
    );
    const resolved = resolveCall(call, program);
    expect(resolved.kind).toBe(KIND_UNKNOWN_MEMBER);
    expect(resolved.methodName).toBe("concat");
  });
});

describe("resolveMemberExpressionCall", () => {
  it("returns 'other' for a non-MemberExpression callee", () => {
    const { call } = firstCallExpression("someUnknownFn();");
    const resolved = resolveMemberExpressionCall(call);
    expect(resolved.kind).toBe("other");
  });
});

describe("isLodashCall", () => {
  it("returns true for lodash identifier calls", () => {
    const { call, program } = firstCallExpression("map(xs, fn);");
    expect(isLodashCall(call, program)).toBe(true);
  });

  it("returns false for non-lodash calls", () => {
    const { call, program } = firstCallExpression("xs.map(fn);");
    expect(isLodashCall(call, program)).toBe(false);
  });
});

describe("lodashDeepImport", () => {
  it("returns the deep import path", () => {
    expect(lodashDeepImport(METHOD_MAP)).toBe("lodash/map.js");
  });
});

describe("lookupLodashEntry", () => {
  it("returns the entry for a known lodash function", () => {
    const entry = lookupLodashEntry(METHOD_MAP);
    expect(entry?.category).toBe("collection");
  });

  it("returns null for an unknown name", () => {
    expect(lookupLodashEntry("notALodashFunction")).toBeNull();
  });
});

describe("isEffectImportedIdentifier", () => {
  const SCHEMA_EFFECT_IMPORT = 'import { Schema } from "effect";';

  it("returns true for an identifier imported from effect", () => {
    const program = parseProgram(SCHEMA_EFFECT_IMPORT);
    const node = { name: "Schema", type: AST_NODE_TYPES.Identifier } as never;
    expect(isEffectImportedIdentifier(node, program)).toBe(true);
  });

  it("returns false for an identifier not imported from effect", () => {
    const program = parseProgram(SCHEMA_EFFECT_IMPORT);
    const node = { name: "Foo", type: AST_NODE_TYPES.Identifier } as never;
    expect(isEffectImportedIdentifier(node, program)).toBe(false);
  });

  it("returns false for a non-Identifier node", () => {
    const program = parseProgram(SCHEMA_EFFECT_IMPORT);
    const node = { type: AST_NODE_TYPES.Literal } as never;
    expect(isEffectImportedIdentifier(node, program)).toBe(false);
  });

  it("returns false when program has no effect imports", () => {
    const program = parseProgram('import { foo } from "other";');
    const node = { name: "foo", type: AST_NODE_TYPES.Identifier } as never;
    expect(isEffectImportedIdentifier(node, program)).toBe(false);
  });

  it("returns false when program has only non-import statements", () => {
    const program = parseProgram("const x = 1;");
    const node = { name: "x", type: AST_NODE_TYPES.Identifier } as never;
    expect(isEffectImportedIdentifier(node, program)).toBe(false);
  });

  it("returns false for a default import from effect", () => {
    const program = parseProgram('import effect from "effect";');
    const node = { name: "effect", type: AST_NODE_TYPES.Identifier } as never;
    expect(isEffectImportedIdentifier(node, program)).toBe(false);
  });

  it("returns false for a namespace import from effect", () => {
    const program = parseProgram('import * as effect from "effect";');
    const node = { name: "effect", type: AST_NODE_TYPES.Identifier } as never;
    expect(isEffectImportedIdentifier(node, program)).toBe(false);
  });
});

describe("isEffectSource", () => {
  it.each([
    ["effect", true],
    ["effect/DateTime", true],
    ["effect/Stream", true],
    ["lodash", false],
    ["react", false],
    ["", false]
  ])("returns %s for source %s", (source, expected) => {
    expect(isEffectSource(source)).toBe(expected);
  });
});

describe("isEffectNamespace", () => {
  it.each([
    ["BigInt", true],
    ["Effect", true],
    ["Match", true],
    ["Option", true],
    ["Stream", true],
    ["Tracer", true],
    ["MyNamespace", false],
    ["BigInteger", false],
    ["", false]
  ])("returns %s for name %s", (name, expected) => {
    expect(isEffectNamespace(name)).toBe(expected);
  });
});
