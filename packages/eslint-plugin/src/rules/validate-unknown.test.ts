import { RuleTester } from "eslint";
import { writeFileSync } from "node:fs";
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

// Each test must use a unique fixture file path. Sharing a single path
// across tests causes TypeScript's program cache to return stale type
// information when the file content changes between tests (e.g., the parser
// reports `Promise.resolve('hi')` as `any` for the second test even though
// its real type is `Promise<string>`).
//
// Fixtures live in a sibling `.fixtures/validate-unknown/` directory so the
// rules/ folder stays clean and the tsconfig can exclude them with a single
// glob.
const fixture = (name: string) => {
  const filePath = path.join(
    pluginDirectory,
    ".fixtures",
    "validate-unknown",
    `${name}.fixture.ts`
  );
  return { code: "", filename: filePath };
};

const runWith = (name: string, code: string) => {
  const { filename } = fixture(name);
  writeFileSync(filename, `${code}\n`);
};

ruleTester.run("validate-unknown", validateUnknownRule as never, {
  invalid: [
    // JSON.parse (returns any) — result assigned to variable
    {
      before() {
        runWith(
          "invalid-json-parse",
          "const raw = '{}' as string;\nconst data = JSON.parse(raw);"
        );
      },
      ...fixture("invalid-json-parse"),
      code: "const raw = '{}' as string;\nconst data = JSON.parse(raw);",
      errors: [{ messageId: "validateUnknown" }]
    },
    // response.json() returning unknown — async handler returns it
    {
      before() {
        runWith(
          "invalid-response-json",
          "declare const response: { json(): unknown };\nexport const handler = async () => response.json();"
        );
      },
      ...fixture("invalid-response-json"),
      code: "declare const response: { json(): unknown };\nexport const handler = async () => response.json();",
      errors: [{ messageId: "validateUnknown" }]
    },
    // Native call returning unknown passed to a typed function
    {
      before() {
        runWith(
          "invalid-send-json-parse",
          "declare const send: (value: unknown) => void;\nexport const handler = (raw: unknown) => send(JSON.parse(raw as string));"
        );
      },
      ...fixture("invalid-send-json-parse"),
      code: "declare const send: (value: unknown) => void;\nexport const handler = (raw: unknown) => send(JSON.parse(raw as string));",
      errors: [{ messageId: "validateUnknown" }]
    },
    // Function returning unknown called then passed to send
    {
      before() {
        runWith(
          "invalid-send-fn",
          "declare const send: (value: unknown) => void;\nexport const handler = (raw: () => unknown) => send(raw());"
        );
      },
      ...fixture("invalid-send-fn"),
      code: "declare const send: (value: unknown) => void;\nexport const handler = (raw: () => unknown) => send(raw());",
      errors: [{ messageId: "validateUnknown" }]
    },
    // Awaiting Promise<unknown> — the awaited value is used
    {
      before() {
        runWith(
          "invalid-await-promise-unknown",
          "export const handler = async (raw: Promise<unknown>) => { const x = await raw; return x; };"
        );
      },
      ...fixture("invalid-await-promise-unknown"),
      code: "export const handler = async (raw: Promise<unknown>) => { const x = await raw; return x; };",
      errors: [{ messageId: "validateUnknown" }]
    },
    // JSON.parse inside a class method
    {
      before() {
        runWith(
          "invalid-class-parse",
          "class Parser { parse(raw: string) { const data = JSON.parse(raw); return data; } }"
        );
      },
      ...fixture("invalid-class-parse"),
      code: "class Parser { parse(raw: string) { const data = JSON.parse(raw); return data; } }",
      errors: [{ messageId: "validateUnknown" }]
    },
    // Call where the callee.object isn't an Identifier — the rule still flags
    // the unknown return value because the call is not a Schema decode.
    {
      before() {
        runWith(
          "invalid-obj-decode",
          "declare const obj: { decodeUnknown(v: unknown): unknown };\ndeclare const value: unknown;\nconst data = obj.decodeUnknown(value);"
        );
      },
      ...fixture("invalid-obj-decode"),
      code: "declare const obj: { decodeUnknown(v: unknown): unknown };\ndeclare const value: unknown;\nconst data = obj.decodeUnknown(value);",
      errors: [{ messageId: "validateUnknown" }]
    },
    // Call where the callee.object is itself a call (not an Identifier) —
    // exercises the non-Identifier branch of `isSchemaDecodeCall.object`.
    {
      before() {
        runWith(
          "invalid-call-decode",
          "declare function getSchema(): { decodeUnknown(v: unknown): unknown };\ndeclare const value: unknown;\nconst data = getSchema().decodeUnknown(value);"
        );
      },
      ...fixture("invalid-call-decode"),
      code: "declare function getSchema(): { decodeUnknown(v: unknown): unknown };\ndeclare const value: unknown;\nconst data = getSchema().decodeUnknown(value);",
      errors: [{ messageId: "validateUnknown" }]
    }
  ],
  valid: [
    // Result immediately discarded (bare statement)
    {
      before() {
        runWith(
          "valid-discarded-json-parse",
          "const raw = '{}' as string;\nJSON.parse(raw);"
        );
      },
      ...fixture("valid-discarded-json-parse"),
      code: "const raw = '{}' as string;\nJSON.parse(raw);"
    },
    // Wrapped in Schema.decodeUnknownSync (curried form)
    {
      before() {
        runWith(
          "valid-schema-curried",
          "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nconst data = Schema.decodeUnknownSync(MySchema)(JSON.parse(raw));"
        );
      },
      ...fixture("valid-schema-curried"),
      code: "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nconst data = Schema.decodeUnknownSync(MySchema)(JSON.parse(raw));"
    },
    // Wrapped in Schema.is
    {
      before() {
        runWith(
          "valid-schema-is",
          "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nif (Schema.is(MySchema)(JSON.parse(raw))) { return true; }\nreturn false;"
        );
      },
      ...fixture("valid-schema-is"),
      code: "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nif (Schema.is(MySchema)(JSON.parse(raw))) { return true; }\nreturn false;"
    },
    // Wrapped in S.decodeUnknownSync (alternate alias)
    {
      before() {
        runWith(
          "valid-s-alias",
          "import { S } from \"effect\";\ndeclare const MySchema: S.Schema<string, string, never>;\nconst raw = '{}' as string;\nconst data = S.decodeUnknownSync(MySchema)(JSON.parse(raw));"
        );
      },
      ...fixture("valid-s-alias"),
      code: "import { S } from \"effect\";\ndeclare const MySchema: S.Schema<string, string, never>;\nconst raw = '{}' as string;\nconst data = S.decodeUnknownSync(MySchema)(JSON.parse(raw));"
    },
    // Strongly typed function (not unknown/any)
    {
      before() {
        runWith(
          "valid-strong-typed",
          "declare function parseThing(raw: string): { ok: boolean };\nconst raw = '{}' as string;\nconst data = parseThing(raw);"
        );
      },
      ...fixture("valid-strong-typed"),
      code: "declare function parseThing(raw: string): { ok: boolean };\nconst raw = '{}' as string;\nconst data = parseThing(raw);"
    },
    // Strongly typed function call inside send — not unknown
    {
      before() {
        runWith(
          "valid-send-strong",
          "declare const send: (value: { ok: boolean }) => void;\ndeclare function parseThing(raw: string): { ok: boolean };\nconst raw = '{}' as string;\nsend(parseThing(raw));"
        );
      },
      ...fixture("valid-send-strong"),
      code: "declare const send: (value: { ok: boolean }) => void;\ndeclare function parseThing(raw: string): { ok: boolean };\nconst raw = '{}' as string;\nsend(parseThing(raw));"
    },
    // Schema.decodeUnknownSync as ExpressionStatement (the inner JSON.parse is discarded)
    {
      before() {
        runWith(
          "valid-schema-discarded",
          "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nSchema.decodeUnknownSync(MySchema)(JSON.parse(raw));"
        );
      },
      ...fixture("valid-schema-discarded"),
      code: "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nSchema.decodeUnknownSync(MySchema)(JSON.parse(raw));"
    },
    {
      before() {
        runWith(
          "valid-eslint-disable",
          "declare const raw: string;\n// eslint-disable-next-line rule-to-test/validate-unknown\nconst data = JSON.parse(raw);"
        );
      },
      ...fixture("valid-eslint-disable"),
      code: "declare const raw: string;\n// eslint-disable-next-line rule-to-test/validate-unknown\nconst data = JSON.parse(raw);"
    },
    // void F() discards the result
    {
      before() {
        runWith(
          "valid-void-discard",
          "const raw = '{}' as string;\nvoid JSON.parse(raw);"
        );
      },
      ...fixture("valid-void-discard"),
      code: "const raw = '{}' as string;\nvoid JSON.parse(raw);"
    },
    // Awaited Promise<unknown> inside Schema.decodeUnknownSync (curried)
    {
      before() {
        runWith(
          "valid-await-schema-curried",
          'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nexport const handler = async (raw: Promise<unknown>) => Schema.decodeUnknownSync(MySchema)(await raw);'
        );
      },
      ...fixture("valid-await-schema-curried"),
      code: 'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nexport const handler = async (raw: Promise<unknown>) => Schema.decodeUnknownSync(MySchema)(await raw);'
    },
    // Discarded await of Promise<unknown>
    {
      before() {
        runWith(
          "valid-discarded-await",
          "export const handler = async (raw: Promise<unknown>) => { await raw; };"
        );
      },
      ...fixture("valid-discarded-await"),
      code: "export const handler = async (raw: Promise<unknown>) => { await raw; };"
    },
    // Schema decode call (non-curried, direct) — Schema.decode*(value) is the validation
    {
      before() {
        runWith(
          "valid-schema-direct",
          'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\ndeclare const value: unknown;\nSchema.decodeUnknownSync(MySchema)(value);'
        );
      },
      ...fixture("valid-schema-direct"),
      code: 'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\ndeclare const value: unknown;\nSchema.decodeUnknownSync(MySchema)(value);'
    },
    // Computed property access — `Schema["decodeUnknown"](MySchema)(value)` is still a Schema decode call
    {
      before() {
        runWith(
          "valid-schema-computed-property",
          'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\ndeclare const value: unknown;\nconst data = Schema["decodeUnknownSync"](MySchema)(value);'
        );
      },
      ...fixture("valid-schema-computed-property"),
      code: 'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\ndeclare const value: unknown;\nconst data = Schema["decodeUnknownSync"](MySchema)(value);'
    },
    // Discarded await — `void await raw;`
    {
      before() {
        runWith(
          "valid-void-await",
          "export const handler = async (raw: Promise<unknown>) => { void await raw; };"
        );
      },
      ...fixture("valid-void-await"),
      code: "export const handler = async (raw: Promise<unknown>) => { void await raw; };"
    },
    // Awaited primitive — `await "hello"` is `string`, not unknown/any.
    {
      before() {
        runWith(
          "valid-await-promise-resolve",
          "export const handler = async () => { const x = await Promise.resolve('hi'); return x; };"
        );
      },
      ...fixture("valid-await-promise-resolve"),
      code: "export const handler = async () => { const x = await Promise.resolve('hi'); return x; };"
    }
  ]
});
