import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashFromPairsRule } from "./prefer-lodash-from-pairs.ts";

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
  "prefer-lodash-from-pairs",
  preferLodashFromPairsRule as never,
  {
    invalid: [
      {
        code: "Object.fromEntries(pairs);",
        errors: [{ messageId: "preferLodashFromPairs" }],
        output: "fromPairs(pairs);"
      },
      {
        code: "const obj = Object.fromEntries(entries);",
        errors: [{ messageId: "preferLodashFromPairs" }],
        output: "const obj = fromPairs(entries);"
      }
    ],
    valid: [
      { code: "Object.keys(obj);" },
      { code: "Object.entries(obj);" },
      { code: "Object.values(obj);" },
      { code: "fn(pairs);" },
      { code: "fromPairs(pairs);" },
      { code: "Object.fromEntries();" },
      { code: "Object.fromEntries(a, b);" }
    ]
  }
);
