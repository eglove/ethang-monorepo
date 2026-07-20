import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashUniqRule } from "./prefer-lodash-uniq.ts";

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
  "prefer-lodash-uniq",
  preferLodashUniqRule as never,
  {
    invalid: [
      // -------- spread-set pattern --------
      {
        code: "[...new Set(arr)];",
        errors: [{ messageId: "preferLodashUniq" }],
        output: "uniq(arr);"
      },
      {
        code: "[...new Set(items)];",
        errors: [{ messageId: "preferLodashUniq" }],
        output: "uniq(items);"
      },
      {
        code: "const result = [...new Set(list.map(x => x.id))];",
        errors: [{ messageId: "preferLodashUniq" }],
        output: "const result = uniq(list.map(x => x.id));"
      },
      // -------- array-from-set pattern --------
      {
        code: "Array.from(new Set(arr));",
        errors: [{ messageId: "preferLodashUniq" }],
        output: "uniq(arr);"
      },
      {
        code: "Array.from(new Set(data));",
        errors: [{ messageId: "preferLodashUniq" }],
        output: "uniq(data);"
      }
    ],
    valid: [
      // -------- not a uniq pattern --------
      { code: "[...new Map(arr)];" },
      { code: "Array.from(arr);" },
      { code: "Array.from(new Map(arr));" },
      { code: "new Set(arr);" },
      { code: "arr.map(x => x * 2);" },
      // -------- Set with no arguments --------
      { code: "Array.from(new Set());" },
      { code: "[...new Set()];" },
      // -------- already using uniq --------
      { code: "uniq(arr);" }
    ]
  }
);
