import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashGroupByRule } from "./prefer-lodash-group-by.ts";

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

ruleTester.run("prefer-lodash-group-by", preferLodashGroupByRule as never, {
  invalid: [
    {
      code: "const x = arr.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {});",
      errors: [{ messageId: "preferLodashGroupBy" }]
    },
    {
      code: "const x = arr.reduce((acc, item) => { (acc[item.group] ||= []).push(item); return acc; }, {});",
      errors: [{ messageId: "preferLodashGroupBy" }]
    }
  ],
  valid: [
    // Non-pattern reduce
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = item; return acc; }, {});"
    },
    // Block with only 1 statement (no return) - covers line 246-249
    {
      code: "const x = arr.reduce((acc, item) => { (acc[item.category] ||= []).push(item); }, {});"
    },
    {
      code: "const x = arr.reduce((acc, item) => { acc.push(item); return acc; }, []);"
    },
    { code: "const x = arr.map(item => item * 2);" },
    { code: "const x = groupBy(arr, 'key');" }
  ]
});
