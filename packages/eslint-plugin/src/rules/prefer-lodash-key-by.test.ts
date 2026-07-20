import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashKeyByRule } from "./prefer-lodash-key-by.ts";

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
  "prefer-lodash-key-by",
  preferLodashKeyByRule as never,
  {
    invalid: [
      {
        code: "const x = arr.reduce((acc, item) => { acc[item.key] = item; return acc; }, {});",
        errors: [{ messageId: "preferLodashKeyBy" }]
      },
      {
        code: "const x = arr.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});",
        errors: [{ messageId: "preferLodashKeyBy" }]
      }
    ],
    valid: [
      { code: "const x = arr.reduce((acc, item) => { acc.push(item); return acc; }, []);" },
      { code: "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 1; return acc; }, {});" },
      { code: "const x = arr.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {});" },
      { code: "const x = arr.map(item => item * 2);" },
      { code: "const x = keyBy(arr, 'key');" }
    ]
  }
);
