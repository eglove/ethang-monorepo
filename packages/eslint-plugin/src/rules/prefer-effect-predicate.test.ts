import { RuleTester } from "eslint";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectPredicateRule } from "./prefer-effect-predicate.ts";

const pluginDirectory = import.meta.dirname;

const fixturesRoot = path.join(
  pluginDirectory,
  ".fixtures",
  "prefer-effect-predicate"
);
const fixture = (name: string) => {
  return {
    code: "",
    filename: path.join(fixturesRoot, `${name}.fixture.ts`)
  };
};

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

ruleTester.run("prefer-effect-predicate", preferEffectPredicateRule as never, {
  invalid: [
    // -------- isBigInt: `typeof value === "bigint"` --------
    {
      code: "typeof value === 'bigint';",
      errors: [{ messageId: "preferEffectPredicateIsBigInt" }]
    },
    {
      code: "typeof value !== 'bigint';",
      errors: [{ messageId: "preferEffectPredicateIsBigInt" }]
    },
    {
      code: "'bigint' === typeof value;",
      errors: [{ messageId: "preferEffectPredicateIsBigInt" }]
    },

    // -------- isSymbol: `typeof value === "symbol"` --------
    {
      code: "typeof value === 'symbol';",
      errors: [{ messageId: "preferEffectPredicateIsSymbol" }]
    },
    {
      code: "typeof value !== 'symbol';",
      errors: [{ messageId: "preferEffectPredicateIsSymbol" }]
    },
    {
      code: "'symbol' === typeof value;",
      errors: [{ messageId: "preferEffectPredicateIsSymbol" }]
    }
  ],
  valid: [
    // -------- Already using Effect is the preferred API --------
    { code: "Predicate.isBigInt(value);" },
    { code: "Predicate.isSymbol(value);" },
    { code: "import { Predicate } from 'effect'; Predicate.isBigInt(value);" },

    // -------- Wave-1-scope decisions: predicate forms lodash already
    //          covers are NOT flagged here. isNull/isUndefined live in
    //          `no-null-undefined-check` and `_.isNil`; isNotNullable
    //          collapses to `_.isObject` in the umbrella rule. --------
    { code: "value === null;" },
    { code: "value === undefined;" },
    { code: "value === null || value === undefined;" },
    { code: "typeof value === 'object';" },
    { code: "typeof value !== 'object';" },

    // -------- Other primitive `typeof` results either map to a
    //          lodash-covered predicate (`_.isBoolean`, `_.isNumber`,
    //          `_.isString`, `_.isFunction`) or aren't a predicate at
    //          all (`undefined`); both fall through to the umbrella
    //          `prefer-lodash` / `no-null-undefined-check` rules. --------
    { code: "typeof value === 'boolean';" },
    { code: "typeof value === 'number';" },
    { code: "typeof value === 'string';" },
    { code: "typeof value === 'function';" },
    { code: "typeof value === 'undefined';" },

    // -------- Non-strict comparison operators are outside the rule. --------
    { code: "typeof value == 'bigint';" },
    { code: "value < null;" },

    // -------- typeof on a non-literal RHS doesn't fire the rule. --------
    { code: "typeof value === MY_TYPE;" },
    { code: "typeof value === `template ${x}`;" },

    // -------- eslint-disable directive on the rule (anchored to a real
    //          fixture file so ESLint's directive scanner has a path). --------
    {
      ...fixture("valid-eslint-disable"),
      code: "// eslint-disable-next-line rule-to-test/prefer-effect-predicate\ntypeof big === 'bigint';"
    }
  ]
});
