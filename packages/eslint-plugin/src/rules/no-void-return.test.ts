import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { noVoidReturnRule } from "./no-void-return.ts";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 2024,
      sourceType: "module"
    }
  }
});

ruleTester.run(
  "no-void-return",
  noVoidReturnRule as never,
  {
    invalid: [
      {
        code: "function fn() { return void 0; }",
        errors: [{ messageId: "noVoidReturn" }],
        output: "function fn() { return; }"
      },
      {
        code: "function fn() { return void(0); }",
        errors: [{ messageId: "noVoidReturn" }],
        output: "function fn() { return; }"
      },
      {
        code: "function fn() { return void foo(); }",
        errors: [{ messageId: "noVoidReturn" }],
        output: "function fn() { return; }"
      }
    ],
    valid: [
      { code: "function fn() { return; }" },
      { code: "function fn() { return undefined; }" },
      { code: "function fn() { return 0; }" },
      { code: "function fn() { return someVar; }" },
      { code: "function fn() { return null; }" }
    ]
  }
);
