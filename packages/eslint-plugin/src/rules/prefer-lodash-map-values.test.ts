import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashMapValuesRule } from "./prefer-lodash-map-values.ts";

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

ruleTester.run("prefer-lodash-mapValues", preferLodashMapValuesRule as never, {
  invalid: [
    // -------- canonical pattern --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v * 2]));",
      errors: [{ messageId: "preferLodashMapValues" }],
      output: "mapValues(obj, v => v * 2);"
    },
    // -------- with block body and return --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(([k, v]) => { return [k, String(v)]; }));",
      errors: [{ messageId: "preferLodashMapValues" }],
      output: "mapValues(obj, v => String(v));"
    },
    // -------- different variable names --------
    {
      code: "Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value + 1]));",
      errors: [{ messageId: "preferLodashMapValues" }],
      output: "mapValues(data, value => value + 1);"
    },
    // -------- nested object expression --------
    {
      code: "Object.fromEntries(Object.entries(config.settings).map(([k, v]) => [k, v.default]));",
      errors: [{ messageId: "preferLodashMapValues" }],
      output: "mapValues(config.settings, v => v.default);"
    },
    // -------- function expression callback --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(function([k, v]) { return [k, v.length]; }));",
      errors: [{ messageId: "preferLodashMapValues" }],
      output: "mapValues(obj, v => v.length);"
    }
  ],
  valid: [
    // -------- already using mapValues --------
    { code: "mapValues(obj, fn);" },
    // -------- Object.fromEntries without .map --------
    { code: "Object.fromEntries(pairs);" },
    // -------- Object.entries without fromEntries wrapper --------
    { code: "Object.entries(obj).map(fn);" },
    // -------- .map does not pass key through (key is transformed) --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toUpperCase(), v]));"
    },
    // -------- callback returns 3 elements --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v, extra]));"
    },
    // -------- callback has no params --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(() => ['a', 1]));"
    },
    // -------- callback param is not ArrayPattern --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(pair => pair));"
    },
    // -------- Object.fromEntries with non-map argument --------
    {
      code: "Object.fromEntries(new Map());"
    },
    // -------- .map on non-Object.entries --------
    {
      code: "Object.fromEntries(arr.map(x => [x, x * 2]));"
    },
    // -------- simple property access (not the pattern) --------
    { code: "obj.map(fn);" },
    // -------- callback body has multiple statements --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(([k, v]) => { const x = v * 2; return [k, x]; }));"
    }
  ]
});
