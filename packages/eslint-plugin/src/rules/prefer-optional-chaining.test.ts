import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferOptionalChainingRule } from "./prefer-optional-chaining.ts";

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
  "prefer-optional-chaining",
  preferOptionalChainingRule as never,
  {
    invalid: [
      {
        code: "x && x.foo;",
        errors: [{ messageId: "preferOptionalChaining" }],
        output: "x?.foo;"
      },
      {
        code: "const val = obj && obj.prop;",
        errors: [{ messageId: "preferOptionalChaining" }],
        output: "const val = obj?.prop;"
      },
      {
        code: "if (config && config.enabled) { }",
        errors: [{ messageId: "preferOptionalChaining" }],
        output: "if (config?.enabled) { }"
      }
    ],
    valid: [
      { code: "x && y;" },
      { code: "x || x.foo;" },
      { code: "x > 0 && x < 10;" },
      { code: "x && fn(x);" },
      { code: "x?.foo;" },
      { code: "x && x.foo && x.bar;" }
    ]
  }
);
