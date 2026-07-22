import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  DECODE_ALIASES,
  getMemberExpressionPropertyName,
  isSchemaAliasReceiver,
  isSchemaDecodeCall,
  isSchemaDecodeCallee,
  SCHEMA_DECODE_METHODS
} from "./schema-decode.ts";

const parseCall = (code: string) => {
  const program = parseForESLint(code, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;

  for (const node of program.body) {
    if (AST_NODE_TYPES.ExpressionStatement !== node.type) {
      continue;
    }
    if (AST_NODE_TYPES.CallExpression === node.expression.type) {
      return node.expression;
    }
  }
  throw new Error(`No call expression found in: ${code}`);
};

const parseMemberExpression = (code: string) => {
  const program = parseForESLint(code, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;

  for (const node of program.body) {
    if (AST_NODE_TYPES.ExpressionStatement !== node.type) {
      continue;
    }
    if (AST_NODE_TYPES.MemberExpression === node.expression.type) {
      return node.expression;
    }
  }
  throw new Error(`No member expression found in: ${code}`);
};

const parseProgram = (code: string) => {
  return parseForESLint(code, {
    ecmaVersion: 2024,
    sourceType: "module"
  }).ast;
};

const walkFirstNode = (program: TSESTree.Program) => {
  const [first] = program.body;
  if (!first) {
    throw new Error("Program is empty");
  }
  if (AST_NODE_TYPES.ExpressionStatement !== first.type) {
    throw new Error("First node is not an expression statement");
  }
  return first.expression;
};

const firstNodeOf = (code: string) => {
  return walkFirstNode(parseProgram(code));
};

const EFFECT_SUCCEED_CALL = "Effect.succeed(1);";

describe("SCHEMA_DECODE_METHODS", () => {
  it("contains the canonical decode family", () => {
    expect(SCHEMA_DECODE_METHODS.has("decodeUnknownSync")).toBe(true);
    expect(SCHEMA_DECODE_METHODS.has("decodeSync")).toBe(true);
    expect(SCHEMA_DECODE_METHODS.has("is")).toBe(true);
    expect(SCHEMA_DECODE_METHODS.has("validate")).toBe(true);
  });

  it("does not contain arbitrary method names", () => {
    expect(SCHEMA_DECODE_METHODS.has("map")).toBe(false);
    expect(SCHEMA_DECODE_METHODS.has("")).toBe(false);
  });
});

describe("DECODE_ALIASES", () => {
  it("contains Schema, S, and Schema$", () => {
    expect(DECODE_ALIASES.has("Schema")).toBe(true);
    expect(DECODE_ALIASES.has("S")).toBe(true);
    expect(DECODE_ALIASES.has("Schema$")).toBe(true);
  });

  it("does not contain arbitrary names", () => {
    expect(DECODE_ALIASES.has("schema")).toBe(false);
    expect(DECODE_ALIASES.has("Effect")).toBe(false);
  });
});

describe("getMemberExpressionPropertyName", () => {
  it.each([
    {
      expected: "decodeUnknownSync",
      source: "Schema.decodeUnknownSync;",
      title: "returns the identifier name for non-computed properties"
    },
    {
      expected: "decodeUnknownSync",
      source: 'Schema["decodeUnknownSync"];',
      title: "returns the string value for computed string literals"
    },
    {
      expected: "decodeUnknownSync",
      source: "Schema[`decodeUnknownSync`];",
      title: "returns the cooked value for static template literals"
    },
    {
      expected: null,
      source: "Schema[123];",
      title: "returns null for computed non-string, non-template literals"
    },
    {
      expected: null,
      source: "Schema[someVar];",
      title: "returns null for computed identifier properties"
    },
    {
      expected: null,
      source: "Schema[`decode${x}Sync`];",
      title: "returns null for template literals with expressions"
    }
  ])("$title", ({ expected, source }) => {
    const member = parseMemberExpression(source);
    expect(getMemberExpressionPropertyName(member)).toBe(expected);
  });

  it("returns null for non-string literals (e.g. numeric, boolean, null)", () => {
    const member = parseMemberExpression("Schema[true];");
    expect(getMemberExpressionPropertyName(member)).toBeNull();
  });

  it("returns null for non-Identifier non-computed property nodes", () => {
    // Force a non-Identifier, non-computed property by faking a node.
    const member = parseMemberExpression("Schema.foo;");
    // Re-narrow as a private-identifier-style node to cover the
    // non-computed defensive branch.
    const fake = {
      ...member,
      computed: false,
      property: { name: "secret", type: AST_NODE_TYPES.PrivateIdentifier }
    } as unknown as TSESTree.MemberExpression;
    expect(getMemberExpressionPropertyName(fake)).toBeNull();
  });
});

describe("isSchemaAliasReceiver", () => {
  it.each([
    { expected: true, source: "Schema.decodeUnknownSync(1);" },
    { expected: true, source: "S.is(1);" },
    { expected: true, source: "Schema$.is(1);" },
    { expected: false, source: "foo();" },
    { expected: false, source: EFFECT_SUCCEED_CALL },
    { expected: false, source: "obj[1]();" }
  ])(
    "isSchemaAliasReceiver returns $expected for $source",
    ({ expected, source }) => {
      const call = parseCall(source);
      expect(isSchemaAliasReceiver(call.callee)).toBe(expected);
    }
  );

  it("returns false for non-node inputs (e.g. an Identifier)", () => {
    const identifier = firstNodeOf("plainIdent;") as TSESTree.Identifier;
    expect(isSchemaAliasReceiver(identifier)).toBe(false);
  });
});

describe("isSchemaDecodeCall", () => {
  it.each([
    "Schema.decodeUnknownSync(1);",
    "Schema.decode(1);",
    "Schema.decodeEither(1);",
    "Schema.decodeExit(1);",
    "Schema.decodeOption(1);",
    "Schema.decodePromise(1);",
    "Schema.decodeSync(1);",
    "Schema.decodeUnknown(1);",
    "Schema.decodeUnknownEither(1);",
    "Schema.decodeUnknownExit(1);",
    "Schema.decodeUnknownOption(1);",
    "Schema.decodeUnknownPromise(1);",
    "Schema.is(1);",
    "Schema.validate(1);",
    "Schema.validateEither(1);",
    "Schema.validateExit(1);",
    "Schema.validateOption(1);",
    "Schema.validatePromise(1);",
    "Schema.validateSync(1);",
    "S.decodeUnknownSync(1);",
    "Schema$.is(1);"
  ])("returns true for known decode method: %s", (code) => {
    expect(isSchemaDecodeCall(parseCall(code))).toBe(true);
  });

  it.each([
    {
      expected: true,
      source: 'Schema["decodeUnknownSync"](1);',
      title: "returns true for computed string-literal decode method"
    },
    {
      expected: true,
      source: "Schema[`decodeUnknownSync`](1);",
      title: "returns true for static template-literal decode method"
    },
    {
      expected: false,
      source: "Schema.parse(1);",
      title: "returns false for non-decode Schema methods"
    },
    {
      expected: false,
      source: EFFECT_SUCCEED_CALL,
      title: "returns false for non-Schema member calls"
    },
    {
      expected: false,
      source: "decodeUnknownSync(1);",
      title: "returns false for non-MemberExpression callees"
    },
    {
      expected: false,
      source: "Schema[123](1);",
      title: "returns false for computed non-string-literal properties"
    },
    {
      expected: false,
      source: "Schema[`decode${x}Sync`](1);",
      title: "returns false for computed template literals with expressions"
    },
    {
      expected: false,
      source: "const m = 'decodeUnknownSync'; Schema[m](1);",
      title: "returns false for computed identifier properties (dynamic)"
    }
  ])("isSchemaDecodeCall $title", ({ expected, source }) => {
    expect(isSchemaDecodeCall(parseCall(source))).toBe(expected);
  });
});

describe("isSchemaDecodeCallee", () => {
  it.each([
    {
      expected: true,
      source: "Schema.decodeUnknownSync(MySchema)(value);",
      title: "returns true for curried Schema decode"
    },
    {
      expected: false,
      source: "myFn(value);",
      title: "returns false for plain function call"
    },
    {
      expected: false,
      source: EFFECT_SUCCEED_CALL,
      title: "returns false for non-Schema member calls"
    }
  ])("isSchemaDecodeCallee $title", ({ expected, source }) => {
    const call = parseCall(source);
    expect(isSchemaDecodeCallee(call.callee)).toBe(expected);
  });

  it("returns false for non-CallExpression nodes", () => {
    const member = firstNodeOf("Schema.foo;");
    expect(isSchemaDecodeCallee(member)).toBe(false);
  });
});
