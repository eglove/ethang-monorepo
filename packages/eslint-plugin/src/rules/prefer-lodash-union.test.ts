import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashUnionRule } from "./prefer-lodash-union.ts";

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

ruleTester.run("prefer-lodash-union", preferLodashUnionRule as never, {
  invalid: [
    // -------- basic rewrite --------
    {
      code: "[...new Set([...a, ...b])];",
      errors: [{ messageId: "preferLodashUnion" }],
      output: "union([a, b]);"
    },

    // -------- with 3 arrays --------
    {
      code: "[...new Set([...a, ...b, ...c])];",
      errors: [{ messageId: "preferLodashUnion" }],
      output: "union([a, b, c]);"
    },

    // -------- with member expressions --------
    {
      code: "[...new Set([...obj.list1, ...obj.list2])];",
      errors: [{ messageId: "preferLodashUnion" }],
      output: "union([obj.list1, obj.list2]);"
    }
  ],
  valid: [
    // -------- not an array --------
    { code: "arr;" },

    // -------- plain array --------
    { code: "[a, b];" },

    // -------- array without Set --------
    { code: "[...arr];" },

    // -------- Set with non-spread elements --------
    { code: "[...new Set([a, b])];" },

    // -------- Set with no arguments --------
    { code: "[...new Set()];" },

    // -------- new Map instead of Set --------
    { code: "[...new Map([[a, b]])];" },

    // -------- multiple outer elements --------
    { code: "[...new Set([...a]), ...b];" },

    // -------- already lodash --------
    { code: "union([a, b]);" }
  ]
});
