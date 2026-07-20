import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { noDoubleUnaryRule } from "./no-double-unary.ts";

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
  "no-double-unary",
  noDoubleUnaryRule as never,
  {
    invalid: [
      {
        code: "!!x;",
        errors: [{ messageId: "noDoubleUnary" }],
        output: "Boolean(x);"
      },
      {
        code: "const y = !!foo();",
        errors: [{ messageId: "noDoubleUnary" }],
        output: "const y = Boolean(foo());"
      },
      {
        code: "if (!!arr.length) { }",
        errors: [{ messageId: "noDoubleUnary" }],
        output: "if (Boolean(arr.length)) { }"
      }
    ],
    valid: [
      { code: "!x;" },
      { code: "-x;" },
      { code: "~x;" },
      { code: "typeof x;" },
      { code: "void x;" },
      { code: "Boolean(x);" }
    ]
  }
);
