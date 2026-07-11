import { RuleTester } from "eslint";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";
import { afterAll } from "vitest";

import { noRedundantExplicitReturnTypeRule } from "./no-redundant-explicit-return-type.ts";

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

const NUMBER_ARROW = "const f = (): number => 5;";
const NUMBER_ARROW_OUTPUT = "const f = () => 5;";

afterAll(() => {
  restore();
});

ruleTester.run(
  "no-redundant-explicit-return-type",
  noRedundantExplicitReturnTypeRule as never,
  {
    invalid: [
      {
        before(): void {
          runWith(NUMBER_ARROW);
        },
        code: NUMBER_ARROW,
        errors: [{ messageId: "redundantReturnType" }],
        filename: fixturePath,
        output: NUMBER_ARROW_OUTPUT
      },
      {
        before(): void {
          runWith('const f = (): string => "hello";');
        },
        code: 'const f = (): string => "hello";',
        errors: [{ messageId: "redundantReturnType" }],
        filename: fixturePath,
        output: 'const f = () => "hello";'
      },
      {
        code: "const f = (): string => 'a';",
        errors: [{ messageId: "redundantReturnType" }],
        filename: fixturePath,
        output: "const f = () => 'a';"
      },
      {
        before(): void {
          runWith(NUMBER_ARROW);
        },
        code: NUMBER_ARROW,
        errors: [{ messageId: "redundantReturnType" }],
        filename: fixturePath,
        options: [{ ignoreExports: true }],
        output: NUMBER_ARROW_OUTPUT
      },
      {
        before(): void {
          runWith(NUMBER_ARROW);
        },
        code: NUMBER_ARROW,
        errors: [{ messageId: "redundantReturnType" }],
        filename: fixturePath,
        output: NUMBER_ARROW_OUTPUT
      }
    ],
    valid: [
      {
        before(): void {
          runWith("const f = (): readonly number[] => [1, 2, 3];");
        },
        code: "const f = (): readonly number[] => [1, 2, 3];",
        filename: fixturePath
      },
      {
        before(): void {
          runWith("const f = <T,>(value: T): T => value;");
        },
        code: "const f = <T,>(value: T): T => value;",
        filename: fixturePath
      },
      {
        before(): void {
          runWith(
            "function f(a: number | string): number | string { return a; }"
          );
        },
        code: "function f(a: number | string): number | string { return a; }",
        filename: fixturePath
      },
      {
        before(): void {
          runWith("class C { greet(): number { return 5; } }");
        },
        code: "class C { greet(): number { return 5; } }",
        filename: fixturePath
      },
      {
        before(): void {
          runWith("declare function f(): number;");
        },
        code: "declare function f(): number;",
        filename: fixturePath
      },
      {
        before(): void {
          runWith("function f(): any { return 1; }");
        },
        code: "function f(): any { return 1; }",
        filename: fixturePath
      },
      {
        before(): void {
          runWith("function f(): unknown { return x; }");
        },
        code: "function f(): unknown { return x; }",
        filename: fixturePath
      },
      {
        before(): void {
          runWith("export const f = (): number => 5;");
        },
        code: "export const f = (): number => 5;",
        filename: fixturePath,
        options: [{ ignoreExports: true }]
      },
      {
        before(): void {
          runWith("const f = (): unknown => 'hello' as unknown;");
        },
        code: "const f = (): unknown => 'hello' as unknown;",
        filename: fixturePath
      },
      {
        before(): void {
          runWith("const f = function (): number { return 1; };");
        },
        code: "const f = function (): number { return 1; };",
        filename: fixturePath
      },
      {
        before(): void {
          runWith("function f(): number {}");
        },
        code: "function f(): number {}",
        filename: fixturePath
      },
      {
        before(): void {
          runWith("abstract class C { abstract method(): number; }");
        },
        code: "abstract class C { abstract method(): number; }",
        filename: fixturePath
      },
      {
        before(): void {
          runWith("class C { method(): void; }");
        },
        code: "class C { method(): void; }",
        filename: fixturePath
      }
    ]
  }
);
