import { RuleTester } from "eslint";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";
import { afterAll } from "vitest";

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

const fixturePath = path.join(pluginDirectory, "fixture.fixture.ts");
const original = readFileSync(fixturePath, "utf8");

const restore = () => {
  writeFileSync(fixturePath, original);
};

const runWith = (code: string) => {
  writeFileSync(fixturePath, `${code}\n`);
};

afterAll(() => {
  restore();
});

ruleTester.run("validate-unknown", validateUnknownRule as never, {
  invalid: [
    // JSON.parse (returns any) — result assigned to variable
    {
      before(): void {
        runWith("const raw = '{}' as string;\nconst data = JSON.parse(raw);");
      },
      code: "const raw = '{}' as string;\nconst data = JSON.parse(raw);",
      errors: [{ messageId: "validateUnknown" }],
      filename: fixturePath
    },
    // response.json() returning unknown — async handler returns it
    {
      before(): void {
        runWith(
          "declare const response: { json(): unknown };\nexport const handler = async () => response.json();"
        );
      },
      code: "declare const response: { json(): unknown };\nexport const handler = async () => response.json();",
      errors: [{ messageId: "validateUnknown" }],
      filename: fixturePath
    },
    // Native call returning unknown passed to a typed function
    {
      before(): void {
        runWith(
          "declare const send: (value: unknown) => void;\nexport const handler = (raw: unknown) => send(JSON.parse(raw as string));"
        );
      },
      code: "declare const send: (value: unknown) => void;\nexport const handler = (raw: unknown) => send(JSON.parse(raw as string));",
      errors: [{ messageId: "validateUnknown" }],
      filename: fixturePath
    },
    // Function returning unknown called then passed to send
    {
      before(): void {
        runWith(
          "declare const send: (value: unknown) => void;\nexport const handler = (raw: () => unknown) => send(raw());"
        );
      },
      code: "declare const send: (value: unknown) => void;\nexport const handler = (raw: () => unknown) => send(raw());",
      errors: [{ messageId: "validateUnknown" }],
      filename: fixturePath
    },
    // Awaiting Promise<unknown> — the awaited value is used
    {
      before(): void {
        runWith(
          "export const handler = async (raw: Promise<unknown>) => { const x = await raw; return x; };"
        );
      },
      code: "export const handler = async (raw: Promise<unknown>) => { const x = await raw; return x; };",
      errors: [{ messageId: "validateUnknown" }],
      filename: fixturePath
    },
    // JSON.parse inside a class method
    {
      before(): void {
        runWith(
          "class Parser { parse(raw: string) { const data = JSON.parse(raw); return data; } }"
        );
      },
      code: "class Parser { parse(raw: string) { const data = JSON.parse(raw); return data; } }",
      errors: [{ messageId: "validateUnknown" }],
      filename: fixturePath
    },
    // Call where the callee.object isn't an Identifier — the rule still flags
    // the unknown return value because the call is not a Schema decode.
    {
      before(): void {
        runWith(
          "declare const obj: { decodeUnknown(v: unknown): unknown };\ndeclare const value: unknown;\nconst data = obj.decodeUnknown(value);"
        );
      },
      code: "declare const obj: { decodeUnknown(v: unknown): unknown };\ndeclare const value: unknown;\nconst data = obj.decodeUnknown(value);",
      errors: [{ messageId: "validateUnknown" }],
      filename: fixturePath
    },
    // Call where the callee.object is itself a call (not an Identifier) —
    // exercises the non-Identifier branch of `isSchemaDecodeCall.object`.
    {
      before(): void {
        runWith(
          "declare function getSchema(): { decodeUnknown(v: unknown): unknown };\ndeclare const value: unknown;\nconst data = getSchema().decodeUnknown(value);"
        );
      },
      code: "declare function getSchema(): { decodeUnknown(v: unknown): unknown };\ndeclare const value: unknown;\nconst data = getSchema().decodeUnknown(value);",
      errors: [{ messageId: "validateUnknown" }],
      filename: fixturePath
    }
  ],
  valid: [
    // Result immediately discarded (bare statement)
    {
      before(): void {
        runWith("const raw = '{}' as string;\nJSON.parse(raw);");
      },
      code: "const raw = '{}' as string;\nJSON.parse(raw);",
      filename: fixturePath
    },
    // Wrapped in Schema.decodeUnknownSync (curried form)
    {
      before(): void {
        runWith(
          "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nconst data = Schema.decodeUnknownSync(MySchema)(JSON.parse(raw));"
        );
      },
      code: "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nconst data = Schema.decodeUnknownSync(MySchema)(JSON.parse(raw));",
      filename: fixturePath
    },
    // Wrapped in Schema.is
    {
      before(): void {
        runWith(
          "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nif (Schema.is(MySchema)(JSON.parse(raw))) { return true; }\nreturn false;"
        );
      },
      code: "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nif (Schema.is(MySchema)(JSON.parse(raw))) { return true; }\nreturn false;",
      filename: fixturePath
    },
    // Wrapped in S.decodeUnknownSync (alternate alias)
    {
      before(): void {
        runWith(
          "import { S } from \"effect\";\ndeclare const MySchema: S.Schema<string, string, never>;\nconst raw = '{}' as string;\nconst data = S.decodeUnknownSync(MySchema)(JSON.parse(raw));"
        );
      },
      code: "import { S } from \"effect\";\ndeclare const MySchema: S.Schema<string, string, never>;\nconst raw = '{}' as string;\nconst data = S.decodeUnknownSync(MySchema)(JSON.parse(raw));",
      filename: fixturePath
    },
    // Strongly typed function (not unknown/any)
    {
      before(): void {
        runWith(
          "declare function parseThing(raw: string): { ok: boolean };\nconst raw = '{}' as string;\nconst data = parseThing(raw);"
        );
      },
      code: "declare function parseThing(raw: string): { ok: boolean };\nconst raw = '{}' as string;\nconst data = parseThing(raw);",
      filename: fixturePath
    },
    // Strongly typed function call inside send — not unknown
    {
      before(): void {
        runWith(
          "declare const send: (value: { ok: boolean }) => void;\ndeclare function parseThing(raw: string): { ok: boolean };\nconst raw = '{}' as string;\nsend(parseThing(raw));"
        );
      },
      code: "declare const send: (value: { ok: boolean }) => void;\ndeclare function parseThing(raw: string): { ok: boolean };\nconst raw = '{}' as string;\nsend(parseThing(raw));",
      filename: fixturePath
    },
    // Schema.decodeUnknownSync as ExpressionStatement (the inner JSON.parse is discarded)
    {
      before(): void {
        runWith(
          "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nSchema.decodeUnknownSync(MySchema)(JSON.parse(raw));"
        );
      },
      code: "import { Schema } from \"effect\";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nconst raw = '{}' as string;\nSchema.decodeUnknownSync(MySchema)(JSON.parse(raw));",
      filename: fixturePath
    },
    {
      before(): void {
        runWith(
          "declare const raw: string;\n// eslint-disable-next-line rule-to-test/validate-unknown\nconst data = JSON.parse(raw);"
        );
      },
      code: "declare const raw: string;\n// eslint-disable-next-line rule-to-test/validate-unknown\nconst data = JSON.parse(raw);",
      filename: fixturePath
    },
    // void F() discards the result
    {
      before(): void {
        runWith("const raw = '{}' as string;\nvoid JSON.parse(raw);");
      },
      code: "const raw = '{}' as string;\nvoid JSON.parse(raw);",
      filename: fixturePath
    },
    // Awaited Promise<unknown> inside Schema.decodeUnknownSync (curried)
    {
      before(): void {
        runWith(
          'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nexport const handler = async (raw: Promise<unknown>) => Schema.decodeUnknownSync(MySchema)(await raw);'
        );
      },
      code: 'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\nexport const handler = async (raw: Promise<unknown>) => Schema.decodeUnknownSync(MySchema)(await raw);',
      filename: fixturePath
    },
    // Discarded await of Promise<unknown>
    {
      before(): void {
        runWith(
          "export const handler = async (raw: Promise<unknown>) => { await raw; };"
        );
      },
      code: "export const handler = async (raw: Promise<unknown>) => { await raw; };",
      filename: fixturePath
    },
    // Schema decode call (non-curried, direct) — Schema.decode*(value) is the validation
    {
      before(): void {
        runWith(
          'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\ndeclare const value: unknown;\nSchema.decodeUnknownSync(MySchema)(value);'
        );
      },
      code: 'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\ndeclare const value: unknown;\nSchema.decodeUnknownSync(MySchema)(value);',
      filename: fixturePath
    },
    // Computed property access — `Schema["decodeUnknown"](MySchema)(value)` is still a Schema decode call
    {
      before(): void {
        runWith(
          'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\ndeclare const value: unknown;\nconst data = Schema["decodeUnknownSync"](MySchema)(value);'
        );
      },
      code: 'import { Schema } from "effect";\ndeclare const MySchema: Schema.Schema<string, string, never>;\ndeclare const value: unknown;\nconst data = Schema["decodeUnknownSync"](MySchema)(value);',
      filename: fixturePath
    },
    // Discarded await — `void await raw;`
    {
      before(): void {
        runWith(
          "export const handler = async (raw: Promise<unknown>) => { void await raw; };"
        );
      },
      code: "export const handler = async (raw: Promise<unknown>) => { void await raw; };",
      filename: fixturePath
    },
    // Awaited primitive — `await "hello"` is `string`, not unknown/any.
    {
      before(): void {
        runWith(
          "export const handler = async () => { const x = await Promise.resolve('hi'); return x; };"
        );
      },
      code: "export const handler = async () => { const x = await Promise.resolve('hi'); return x; };",
      filename: fixturePath
    }
  ]
});
