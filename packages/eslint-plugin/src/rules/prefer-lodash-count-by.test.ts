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

ruleTester.run("prefer-lodash-count-by", preferLodashCountByRule as never, {
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
    // Non-countBy reduce (simple assignment)
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = item; return acc; }, {});"
    },
    // Non-countBy reduce (push pattern - groupBy)
    {
      code: "const x = arr.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {});"
    },
    // push with array initial value
    {
      code: "const x = arr.reduce((acc, item) => { acc.push(item); return acc; }, []);"
    },
    // Block with only 1 statement (returns null early at line 268-271)
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = item; }, {});"
    },
    // Block with 2 statements but return is wrong variable (uncovers returnsAccumulator false branch)
    {
      code: "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 1; return wrongVar; }, {});"
    },
    // Non-reduce
    { code: "const x = arr.map(item => item * 2);" },
    // Already using countBy
    { code: "const x = countBy(arr, 'key');" }
  ]
});
