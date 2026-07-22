import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashIntersectionRule } from "./prefer-lodash-intersection.ts";

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
  "prefer-lodash-intersection",
  preferLodashIntersectionRule as never,
  {
    invalid: [
      // -------- basic rewrite --------
      {
        code: "arr.filter(x => arr2.includes(x));",
        errors: [{ messageId: "preferLodashIntersection" }],
        output: "intersection(arr, arr2);"
      },

      // -------- with parentheses around param --------
      {
        code: "items.filter((x) => targets.includes(x));",
        errors: [{ messageId: "preferLodashIntersection" }],
        output: "intersection(items, targets);"
      },

      // -------- different variable names --------
      {
        code: "a.filter(x => b.includes(x));",
        errors: [{ messageId: "preferLodashIntersection" }],
        output: "intersection(a, b);"
      },

      // -------- chained receiver --------
      {
        code: "list.map(fn).filter(x => allowed.includes(x));",
        errors: [{ messageId: "preferLodashIntersection" }],
        output: "intersection(list.map(fn), allowed);"
      },

      // -------- nested property as arr2 --------
      {
        code: "arr.filter(x => obj.list.includes(x));",
        errors: [{ messageId: "preferLodashIntersection" }],
        output: "intersection(arr, obj.list);"
      }
    ],
    valid: [
      // -------- not a filter call --------
      { code: "arr.map(x => arr2.includes(x));" },
      { code: "arr.find(x => arr2.includes(x));" },

      // -------- negated includes (difference pattern, not intersection) --------
      { code: "arr.filter(x => !arr2.includes(x));" },

      // -------- includes with extra args --------
      { code: "arr.filter(x => arr2.includes(x, 1));" },

      // -------- includes with different param --------
      { code: "arr.filter(x => arr2.includes(y));" },

      // -------- arrow with multiple params --------
      { code: "arr.filter((x, i) => arr2.includes(x));" },

      // -------- block body --------
      { code: "arr.filter(x => { return arr2.includes(x); });" },

      // -------- function expression --------
      {
        code: "arr.filter(function (x) { return arr2.includes(x); });"
      },

      // -------- computed method access --------
      { code: "arr['filter'](x => arr2.includes(x));" },

      // -------- non-identifier arr2 --------
      { code: "arr.filter(x => getArr().includes(x));" },

      // -------- already lodash --------
      { code: "intersection(arr, arr2);" },

      // -------- no callback --------
      { code: "arr.filter();" }
    ]
  }
);
