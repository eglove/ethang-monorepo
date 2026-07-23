import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectNumberParseRule } from "./prefer-effect-number-parse.ts";

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
  "prefer-effect-number-parse",
  preferEffectNumberParseRule as never,
  {
    invalid: [
      {
        code: "const x = Number(s);",
        errors: [{ messageId: "preferEffectNumberParse" }]
      },
      {
        code: "const x = Number(value);",
        errors: [{ messageId: "preferEffectNumberParse" }]
      },
      {
        code: 'const x = Number(str + "");',
        errors: [{ messageId: "preferEffectNumberParse" }]
      },
      {
        code: "const x = parseFloat(s);",
        errors: [{ messageId: "preferEffectNumberParse" }]
      },
      {
        code: "const x = parseFloat(input);",
        errors: [{ messageId: "preferEffectNumberParse" }]
      }
    ],
    valid: [
      // Number static methods should not be flagged
      { code: "const x = Number.isNaN(s);" },
      { code: "const x = Number.isFinite(s);" },
      { code: "const x = Number.isInteger(s);" },
      { code: "const x = Number.isSafeInteger(s);" },
      // Already using Number.parse
      { code: "const x = Number.parse(s);" },
      // Non-Number calls
      { code: "const x = String(5);" },
      { code: "const x = Boolean(1);" },
      // Number with no arguments
      { code: "const x = Number();" },
      // Number with spread
      { code: "const x = Number(...args);" },
      // parseFloat with no arguments
      { code: "const x = parseFloat();" },
      // parseFloat with spread
      { code: "const x = parseFloat(...args);" },
      // new Number() - constructor, not coercion
      { code: "const x = new Number(s);" },
      // Other global parse functions
      { code: "const x = parseInt(s);" },
      { code: "const x = parseInt(s, 10);" }
    ]
  }
);
