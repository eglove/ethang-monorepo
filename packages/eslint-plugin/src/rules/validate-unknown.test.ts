import { RuleTester } from "eslint";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { validateUnknownRule } from "./validate-unknown.ts";

const pluginDirectory = import.meta.dirname;
const packageRoot = path.resolve(pluginDirectory, "..", "..");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 2024,
      project: [path.join(packageRoot, "tsconfig.test.json")],
      sourceType: "module",
      tsconfigRootDir: packageRoot,
      warnOnUnsupportedTypeScriptVersion: false
    }
  }
});

// Each test uses a unique committed fixture file under
// `.fixtures/validate-unknown/`. Unique paths are required because the
// TypeScript program caches ASTs per file path; reusing a single fixture
// across tests causes the parser to report stale type information
// (e.g. `Promise.resolve('hi')` typed as `any` instead of `Promise<string>`).
//
// The fixtures are static and committed to the repository so the parser
// can load the program on a fresh clone (no runtime fs writes, no race
// between fixture creation and parser invocation). They are excluded from
// the production tsconfig (`tsconfig.json`) but included in the test
// tsconfig (`tsconfig.test.json`).
const fixturesRoot = path.join(
  pluginDirectory,
  ".fixtures",
  "validate-unknown"
);
const fixture = (name: string) => {
  return {
    code: "",
    filename: path.join(fixturesRoot, `${name}.fixture.ts`)
  };
};

ruleTester.run("validate-unknown", validateUnknownRule as never, {
  invalid: [
    // JSON.parse (returns any) — result assigned to variable
    {
      ...fixture("invalid-json-parse"),
      code: "const raw = '{}' as string;\nconst data = JSON.parse(raw);",
      errors: [{ messageId: "validateUnknown" }]
    },
    // response.json() returning unknown — async handler returns it
    {
      ...fixture("invalid-response-json"),
      code: "declare const response: { json(): unknown };\nexport const handler = async () => response.json();",
      errors: [{ messageId: "validateUnknown" }]
    },
    // Native call returning unknown passed to a typed function
    {
      ...fixture("invalid-send-json-parse"),
      code: "declare const send: (value: unknown) => void;\nexport const handler = (raw: unknown) => send(JSON.parse(raw as string));",
      errors: [{ messageId: "validateUnknown" }]
    },
    // Function returning unknown called then passed to send
    {
      ...fixture("invalid-send-fn"),
      code: "declare const send: (value: unknown) => void;\nexport const handler = (raw: () => unknown) => send(raw());",
      errors: [{ messageId: "validateUnknown" }]
    },
    // Awaiting Promise<unknown> — the awaited value is used
    {
      ...fixture("invalid-await-promise-unknown"),
      code: "export const handler = async (raw: Promise<unknown>) => { const x = await raw; return x; };",
      errors: [{ messageId: "validateUnknown" }]
    },
    // JSON.parse inside a class method
    {
      ...fixture("invalid-class-parse"),
      code: "class Parser { parse(raw: string) { const data = JSON.parse(raw); return data; } }",
      errors: [{ messageId: "validateUnknown" }]
    },
    // Call where the callee.object isn't an Identifier — the rule still flags
    // the unknown return value because the call is not a Schema decode.
    {
      ...fixture("invalid-obj-decode"),
      code: "declare const obj: { decodeUnknown(v: unknown): unknown };\ndeclare const value: unknown;\nconst data = obj.decodeUnknown(value);",
      errors: [{ messageId: "validateUnknown" }]
    },
    // Call where the callee.object is itself a call (not an Identifier) —
    // exercises the non-Identifier branch of `isSchemaDecodeCall.object`.
    {
      ...fixture("invalid-call-decode"),
      code: "declare function getSchema(): { decodeUnknown(v: unknown): unknown };\ndeclare const value: unknown;\nconst data = getSchema().decodeUnknown(value);",
      errors: [{ messageId: "validateUnknown" }]
    }
  ],
  valid: [
    // Result immediately discarded (bare statement)
    {
      ...fixture("valid-discarded-json-parse"),
      code: "const raw = '{}' as string;\nJSON.parse(raw);"
    },
    // Wrapped in Schema.decodeUnknownSync (curried form)
    {
      ...fixture("valid-schema-curried"),
      code: "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nconst data = Schema.decodeUnknownSync(MySchema)(JSON.parse(raw));"
    },
    // Wrapped in Schema.is
    {
      ...fixture("valid-schema-is"),
      code: "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nif (Schema.is(MySchema)(JSON.parse(raw))) { return true; }\nreturn false;"
    },
    // Wrapped in S.decodeUnknownSync (alternate alias)
    {
      ...fixture("valid-s-alias"),
      code: "import { S } from \"effect\";\ndeclare const MySchema: S.Schema<string, string, never>;\nconst raw = '{}' as string;\nconst data = S.decodeUnknownSync(MySchema)(JSON.parse(raw));"
    },
    // Strongly typed function (not unknown/any)
    {
      ...fixture("valid-strong-typed"),
      code: "declare function parseThing(raw: string): { ok: boolean };\nconst raw = '{}' as string;\nconst data = parseThing(raw);"
    },
    // Strongly typed function call inside send — not unknown
    {
      ...fixture("valid-send-strong"),
      code: "declare const send: (value: { ok: boolean }) => void;\ndeclare function parseThing(raw: string): { ok: boolean };\nconst raw = '{}' as string;\nsend(parseThing(raw));"
    },
    // Schema.decodeUnknownSync as ExpressionStatement (the inner JSON.parse is discarded)
    {
      ...fixture("valid-schema-discarded"),
      code: "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nSchema.decodeUnknownSync(MySchema)(JSON.parse(raw));"
    },
    {
      ...fixture("valid-eslint-disable"),
      code: "declare const raw: string;\n// eslint-disable-next-line rule-to-test/validate-unknown\nconst data = JSON.parse(raw);"
    },
    // void F() discards the result
    {
      ...fixture("valid-void-discard"),
      code: "const raw = '{}' as string;\nvoid JSON.parse(raw);"
    },
    // Awaited Promise<unknown> inside Schema.decodeUnknownSync (curried)
    {
      ...fixture("valid-await-schema-curried"),
      code: 'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nexport const handler = async (raw: Promise<unknown>) => Schema.decodeUnknownSync(MySchema)(await raw);'
    },
    // Discarded await of Promise<unknown>
    {
      ...fixture("valid-discarded-await"),
      code: "export const handler = async (raw: Promise<unknown>) => { await raw; };"
    },
    // Schema decode call (non-curried, direct) — Schema.decode*(value) is the validation
    {
      ...fixture("valid-schema-direct"),
      code: 'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\ndeclare const value: unknown;\nSchema.decodeUnknownSync(MySchema)(value);'
    },
    // Computed property access — `Schema["decodeUnknown"](MySchema)(value)` is still a Schema decode call
    {
      ...fixture("valid-schema-computed-property"),
      code: 'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\ndeclare const value: unknown;\nconst data = Schema["decodeUnknownSync"](MySchema)(value);'
    },
    // Discarded await — `void await raw;`
    {
      ...fixture("valid-void-await"),
      code: "export const handler = async (raw: Promise<unknown>) => { void await raw; };"
    },
    // Awaited primitive — `await "hello"` is `string`, not unknown/any.
    {
      ...fixture("valid-await-promise-resolve"),
      code: "export const handler = async () => { const x = await Promise.resolve('hi'); return x; };"
    }
  ]
});
