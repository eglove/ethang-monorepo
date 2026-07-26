import { RuleTester } from "eslint";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";
import { afterAll } from "vitest";

import { noExplicitReturnTypeRule } from "./no-explicit-return-type.ts";

const pluginDirectory = import.meta.dirname;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 2024,
      sourceType: "module",
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

const NUMBER_ARROW_OUTPUT = "const f = () => 5;";
const FUNCTION_NUMBER = "function f(): number { return 5; }";
const FUNCTION_NUMBER_OUTPUT = "function f() { return 5; }";
const CLASS_GREET = "class C { greet(): number { return 5; } }";
const CLASS_GREET_OUTPUT = "class C { greet() { return 5; } }";
const MESSAGE_ID = "explicitReturnType";
const FILENAME = fixturePath;

afterAll(() => {
  restore();
});

ruleTester.run("no-explicit-return-type", noExplicitReturnTypeRule as never, {
  invalid: [
    {
      before() {
        runWith("const f = (): string => 'hello';");
      },
      code: "const f = (): string => 'hello';",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "const f = () => 'hello';"
    },
    {
      before() {
        runWith("async function f(): Promise<number> { return 5; }");
      },
      code: "async function f(): Promise<number> { return 5; }",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "async function f() { return 5; }"
    },
    {
      before() {
        runWith(FUNCTION_NUMBER);
      },
      code: FUNCTION_NUMBER,
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: FUNCTION_NUMBER_OUTPUT
    },
    {
      before() {
        runWith("const f = function (): number { return 1; };");
      },
      code: "const f = function (): number { return 1; };",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "const f = function () { return 1; };"
    },
    {
      before() {
        runWith(CLASS_GREET);
      },
      code: CLASS_GREET,
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: CLASS_GREET_OUTPUT
    },
    {
      before() {
        runWith("const o = { greet(): number { return 5; } };");
      },
      code: "const o = { greet(): number { return 5; } };",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "const o = { greet() { return 5; } };"
    },
    {
      before() {
        runWith("function f(): any { return 1; }");
      },
      code: "function f(): any { return 1; }",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "function f() { return 1; }"
    },
    {
      before() {
        runWith("function f(): unknown { return x; }");
      },
      code: "function f(): unknown { return x; }",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "function f() { return x; }"
    },
    {
      before() {
        runWith("const f = <T,>(value: T): T => value;");
      },
      code: "const f = <T,>(value: T): T => value;",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "const f = <T,>(value: T) => value;"
    },
    {
      before() {
        runWith(
          "function f(a: number | string): number | string { return a; }"
        );
      },
      code: "function f(a: number | string): number | string { return a; }",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "function f(a: number | string) { return a; }"
    },
    {
      before() {
        runWith("const f = (): readonly number[] => [1, 2, 3];");
      },
      code: "const f = (): readonly number[] => [1, 2, 3];",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "const f = () => [1, 2, 3];"
    },
    {
      before() {
        runWith("export const f = (): number => 5;");
      },
      code: "export const f = (): number => 5;",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "export const f = () => 5;"
    },
    {
      before() {
        runWith("export function f(): number { return 5; }");
      },
      code: "export function f(): number { return 5; }",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "export function f() { return 5; }"
    },
    {
      before() {
        runWith("declare function f(): number;");
      },
      code: "declare function f(): number;",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "declare function f();"
    },
    {
      before() {
        runWith("abstract class C { abstract method(): number; }");
      },
      code: "abstract class C { abstract method(): number; }",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "abstract class C { abstract method(); }"
    },
    {
      before() {
        runWith("class C { method(): void; }");
      },
      code: "class C { method(): void; }",
      errors: [{ messageId: "explicitReturnType" }],
      filename: FILENAME,
      output: "class C { method(); }"
    },
    {
      before() {
        runWith(
          "function f(): number & string { return 1 as unknown as number & string; }"
        );
      },
      code: "function f(): number & string { return 1 as unknown as number & string; }",
      errors: [{ messageId: MESSAGE_ID }],
      filename: FILENAME,
      output: "function f() { return 1 as unknown as number & string; }"
    }
  ],
  valid: [
    {
      before() {
        runWith(NUMBER_ARROW_OUTPUT);
      },
      code: NUMBER_ARROW_OUTPUT,
      filename: FILENAME
    },
    {
      before() {
        runWith(FUNCTION_NUMBER_OUTPUT);
      },
      code: FUNCTION_NUMBER_OUTPUT,
      filename: FILENAME
    },
    {
      before() {
        runWith(CLASS_GREET_OUTPUT);
      },
      code: CLASS_GREET_OUTPUT,
      filename: FILENAME
    },
    {
      before() {
        runWith("type T = number;");
      },
      code: "type T = number;",
      filename: FILENAME
    },
    {
      before() {
        runWith(
          "const isFoo = (node: unknown): node is number => typeof node === 'number';"
        );
      },
      code: "const isFoo = (node: unknown): node is number => typeof node === 'number';",
      filename: FILENAME
    },
    {
      before() {
        runWith(
          "import { Effect } from 'effect'; const f = (): Effect.Effect<number, Error> => Effect.succeed(1);"
        );
      },
      code: "import { Effect } from 'effect'; const f = (): Effect.Effect<number, Error> => Effect.succeed(1);",
      filename: FILENAME
    },
    {
      before() {
        runWith(
          "import { Effect } from 'effect'; const f = (): Effect<number, Error> => Effect.succeed(1);"
        );
      },
      code: "import { Effect } from 'effect'; const f = (): Effect<number, Error> => Effect.succeed(1);",
      filename: FILENAME
    },
    {
      before() {
        runWith(
          "import { Effect } from 'effect'; const f = (): Effect.Effect.Success<number, Error> => Effect.succeed(1);"
        );
      },
      code: "import { Effect } from 'effect'; const f = (): Effect.Effect.Success<number, Error> => Effect.succeed(1);",
      filename: FILENAME
    },
    {
      before() {
        runWith(
          "import { Effect } from 'effect'; const f = async (): Promise<Effect.Effect<number, Error>> => Effect.succeed(1);"
        );
      },
      code: "import { Effect } from 'effect'; const f = async (): Promise<Effect.Effect<number, Error>> => Effect.succeed(1);",
      filename: FILENAME
    },
    {
      before() {
        runWith(
          "import { Effect } from 'effect'; const f = (): Effect<number, Error> & { _tag: 'foo' } => Effect.succeed(1);"
        );
      },
      code: "import { Effect } from 'effect'; const f = (): Effect<number, Error> & { _tag: 'foo' } => Effect.succeed(1);",
      filename: FILENAME
    }
  ]
});
