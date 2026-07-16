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
  it("returns the identifier name for non-computed properties", () => {
    const member = parseMemberExpression("Schema.decodeUnknownSync;");
    expect(getMemberExpressionPropertyName(member)).toBe("decodeUnknownSync");
  });

  it("returns the string value for computed string literals", () => {
    const member = parseMemberExpression('Schema["decodeUnknownSync"];');
    expect(getMemberExpressionPropertyName(member)).toBe("decodeUnknownSync");
  });

  it("returns the cooked value for static template literals", () => {
    const member = parseMemberExpression("Schema[`decodeUnknownSync`];");
    expect(getMemberExpressionPropertyName(member)).toBe("decodeUnknownSync");
  });

  it("returns null for computed non-string, non-template literals", () => {
    const member = parseMemberExpression("Schema[123];");
    expect(getMemberExpressionPropertyName(member)).toBeNull();
  });

  it("returns null for computed identifier properties", () => {
    const member = parseMemberExpression("Schema[someVar];");
    expect(getMemberExpressionPropertyName(member)).toBeNull();
  });

  it("returns null for template literals with expressions", () => {
    const member = parseMemberExpression("Schema[`decode${x}Sync`];");
    expect(getMemberExpressionPropertyName(member)).toBeNull();
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
  it("returns true for Schema.foo()", () => {
    const call = parseCall("Schema.decodeUnknownSync(1);");
    expect(isSchemaAliasReceiver(call.callee)).toBe(true);
  });

  it("returns true for S.foo()", () => {
    const call = parseCall("S.is(1);");
    expect(isSchemaAliasReceiver(call.callee)).toBe(true);
  });

  it("returns true for Schema$.foo()", () => {
    const call = parseCall("Schema$.is(1);");
    expect(isSchemaAliasReceiver(call.callee)).toBe(true);
  });

  it("returns false for non-MemberExpression callees", () => {
    const call = parseCall("foo();");
    expect(isSchemaAliasReceiver(call.callee)).toBe(false);
  });

  it("returns false for non-Schema receivers (Effect, lodash, etc.)", () => {
    const call = parseCall(EFFECT_SUCCEED_CALL);
    expect(isSchemaAliasReceiver(call.callee)).toBe(false);
  });

  it("returns false when the object is a non-Identifier expression", () => {
    const call = parseCall("obj[1]();");
    expect(isSchemaAliasReceiver(call.callee)).toBe(false);
  });

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

  it("returns true for computed string-literal decode method", () => {
    expect(
      isSchemaDecodeCall(parseCall('Schema["decodeUnknownSync"](1);'))
    ).toBe(true);
  });

  it("returns true for static template-literal decode method", () => {
    expect(
      isSchemaDecodeCall(parseCall("Schema[`decodeUnknownSync`](1);"))
    ).toBe(true);
  });

  it("returns false for non-decode Schema methods", () => {
    expect(isSchemaDecodeCall(parseCall("Schema.parse(1);"))).toBe(false);
  });

  it("returns false for non-Schema member calls", () => {
    expect(isSchemaDecodeCall(parseCall(EFFECT_SUCCEED_CALL))).toBe(false);
  });

  it("returns false for non-MemberExpression callees", () => {
    expect(isSchemaDecodeCall(parseCall("decodeUnknownSync(1);"))).toBe(false);
  });

  it("returns false for computed non-string-literal properties", () => {
    expect(isSchemaDecodeCall(parseCall("Schema[123](1);"))).toBe(false);
  });

  it("returns false for computed template literals with expressions", () => {
    expect(isSchemaDecodeCall(parseCall("Schema[`decode${x}Sync`](1);"))).toBe(
      false
    );
  });

  it("returns false for computed identifier properties (dynamic)", () => {
    expect(
      isSchemaDecodeCall(
        parseCall("const m = 'decodeUnknownSync'; Schema[m](1);")
      )
    ).toBe(false);
  });
});

describe("isSchemaDecodeCallee", () => {
  it("returns true for curried Schema decode", () => {
    const call = parseCall("Schema.decodeUnknownSync(MySchema)(value);");
    expect(isSchemaDecodeCallee(call.callee)).toBe(true);
  });

  it("returns false for plain function call", () => {
    const call = parseCall("myFn(value);");
    expect(isSchemaDecodeCallee(call.callee)).toBe(false);
  });

  it("returns false for non-Schema member calls", () => {
    const call = parseCall(EFFECT_SUCCEED_CALL);
    expect(isSchemaDecodeCallee(call.callee)).toBe(false);
  });

  it("returns false for non-CallExpression nodes", () => {
    const member = firstNodeOf("Schema.foo;");
    expect(isSchemaDecodeCallee(member)).toBe(false);
  });
});
