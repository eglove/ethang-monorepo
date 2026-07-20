import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashCountByRule } from "./prefer-lodash-count-by.ts";

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
  "prefer-lodash-count-by",
  preferLodashCountByRule as never,
  {
    invalid: [
      {
        code: "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 1; return acc; }, {});",
        errors: [{ messageId: "preferLodashCountBy" }]
      },
      {
        code: "const x = arr.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc; }, {});",
        errors: [{ messageId: "preferLodashCountBy" }]
      }
    ],
    valid: [
      { code: "const x = arr.reduce((acc, item) => { acc[item.key] = item; return acc; }, {});" },
      { code: "const x = arr.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {});" },
      { code: "const x = arr.reduce((acc, item) => { acc.push(item); return acc; }, []);" },
      { code: "const x = arr.map(item => item * 2);" },
      { code: "const x = countBy(arr, 'key');" }
    ]
  }
);
