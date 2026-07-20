import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectPredicateIsIterableRule } from "./prefer-effect-predicate-is-iterable.ts";

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
  "prefer-effect-predicate-is-iterable",
  preferEffectPredicateIsIterableRule as never,
  {
    invalid: [
      {
        code: "Symbol.iterator in x;",
        errors: [{ messageId: "preferEffectPredicateIsIterable" }]
      },
      {
        code: "if (Symbol.iterator in obj) { }",
        errors: [{ messageId: "preferEffectPredicateIsIterable" }]
      }
    ],
    valid: [
      { code: "Symbol.iterator === x;" },
      { code: "x in y;" },
      { code: "Symbol.toStringTag in x;" },
      { code: "Symbol.hasInstance in x;" },
      { code: "Symbol.iterator;" }
    ]
  }
);