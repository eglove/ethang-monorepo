import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashMapKeysRule } from "./prefer-lodash-map-keys.ts";

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

ruleTester.run("prefer-lodash-mapKeys", preferLodashMapKeysRule as never, {
  invalid: [
    // -------- canonical pattern --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toUpperCase(), v]));",
      errors: [{ messageId: "preferLodashMapKeys" }],
      output: "mapKeys(obj, k => k.toUpperCase());"
    },
    // -------- with block body and return --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(([k, v]) => { return [String(k), v]; }));",
      errors: [{ messageId: "preferLodashMapKeys" }],
      output: "mapKeys(obj, k => String(k));"
    },
    // -------- different variable names --------
    {
      code: "Object.fromEntries(Object.entries(data).map(([key, value]) => [key + '_suffix', value]));",
      errors: [{ messageId: "preferLodashMapKeys" }],
      output: "mapKeys(data, key => key + '_suffix');"
    },
    // -------- nested object expression --------
    {
      code: "Object.fromEntries(Object.entries(config.settings).map(([k, v]) => [k.toLowerCase(), v]));",
      errors: [{ messageId: "preferLodashMapKeys" }],
      output: "mapKeys(config.settings, k => k.toLowerCase());"
    },
    // -------- function expression callback --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(function([k, v]) { return [k.trim(), v]; }));",
      errors: [{ messageId: "preferLodashMapKeys" }],
      output: "mapKeys(obj, k => k.trim());"
    }
  ],
  valid: [
    // -------- already using mapKeys --------
    { code: "mapKeys(obj, fn);" },
    // -------- Object.fromEntries without .map --------
    { code: "Object.fromEntries(pairs);" },
    // -------- Object.entries without fromEntries wrapper --------
    { code: "Object.entries(obj).map(fn);" },
    // -------- .map does not pass value through (value is transformed) --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v * 2]));"
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
      code: "Object.fromEntries(Object.entries(obj).map(([k, v]) => { const x = k.toUpperCase(); return [x, v]; }));"
    },
    // -------- both key and value transformed (not mapKeys) --------
    {
      code: "Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toUpperCase(), v * 2]));"
    }
  ]
});
