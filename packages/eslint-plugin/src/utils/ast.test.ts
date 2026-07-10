import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import {
  ensureEffectImport,
  ensureLodashImport,
  getImportedKind,
  isEffectImportedIdentifier,
  isLodashCall,
  lodashDeepImport,
  lookupLodashEntry,
  resolveCall,
  resolveMemberExpressionCall
} from "./ast.ts";

const parseProgram = (code: string): TSESTree.Program => {
  return parseForESLint(code, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;
};

const NOOP_FIX = constant(null);
const FAKE_FIX = constant({ range: [10, 10], text: "" } as never);
const NO_CALL_EXPRESSION_FOUND = "no call expression found in:";
const METHOD_MAP = "map";
const SOURCE_CODE_AST_CONTEXT = (program: TSESTree.Program) => {
  return { sourceCode: { ast: program } };
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
  throw new Error(`${NO_CALL_EXPRESSION_FOUND} ${code}`);
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
    const fixer = { insertTextAfter: NOOP_FIX } as never;
    expect(ensureEffectImport(program, fixer)).toBeNull();
  });

  it("inserts an import when program is empty", () => {
    const program = parseProgram("");
    const fixer = { insertTextAfter: FAKE_FIX } as never;
    const fix = ensureEffectImport(program, fixer);
    expect(fix).toBeDefined();
  });

  it("inserts an import when effect is missing", () => {
    const program = parseProgram(CONST_X);
    const fixer = { insertTextAfter: FAKE_FIX } as never;
    const fix = ensureEffectImport(program, fixer);
    expect(fix).toBeDefined();
  });
});

describe("ensureLodashImport", () => {
  it("returns null when the deep import is already present", () => {
    const program = parseProgram('import map from "lodash/map.js";');
    const fixer = { insertTextAfter: NOOP_FIX } as never;
    expect(ensureLodashImport(program, METHOD_MAP, fixer)).toBeNull();
  });

  it("inserts a deep import when missing", () => {
    const program = parseProgram(CONST_X);
    const fixer = { insertTextAfter: FAKE_FIX } as never;
    const fix = ensureLodashImport(program, METHOD_MAP, fixer);
    expect(fix).toBeDefined();
  });

  it("inserts a deep import when a different lodash import exists", () => {
    const program = parseProgram('import filter from "lodash/filter.js";');
    const fixer = { insertTextAfter: FAKE_FIX } as never;
    const fix = ensureLodashImport(program, METHOD_MAP, fixer);
    expect(fix).toBeDefined();
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
    expect(resolveCall(call, program).kind).toBe("unknown-member");
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
