import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectArrayScanRule } from "./prefer-effect-array-scan.ts";

const MESSAGE_ID = "preferEffectArrayScan";

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

ruleTester.run("prefer-effect-array-scan", preferEffectArrayScanRule as never, {
  invalid: [
    // -------- basic scan pattern: reduce with [init] and [...acc, ...] --------
    {
      code: "arr.reduce((acc, x) => [...acc, acc[acc.length - 1] + x], [0]);",
      errors: [{ messageId: MESSAGE_ID }]
    },
    // -------- with variable names --------
    {
      code: "items.reduce((result, item) => [...result, process(result, item)], [initialValue]);",
      errors: [{ messageId: MESSAGE_ID }]
    },
    // -------- nested expression in spread --------
    {
      code: "data.reduce((acc, v) => [...acc, f(acc.at(-1), v)], [seed]);",
      errors: [{ messageId: MESSAGE_ID }]
    },
    // -------- callback with more complex body --------
    {
      code: "nums.reduce((acc, n) => [...acc, acc[acc.length - 1] * n], [1]);",
      errors: [{ messageId: MESSAGE_ID }]
    },
    // -------- function expression (not arrow) --------
    {
      code: "arr.reduce(function(acc, x) { return [...acc, acc[acc.length - 1] + x]; }, [0]);",
      errors: [{ messageId: MESSAGE_ID }]
    },
    // -------- scan with three callback params --------
    {
      code: "arr.reduce((acc, x, i) => [...acc, fn(acc, x, i)], [init]);",
      errors: [{ messageId: MESSAGE_ID }]
    }
  ],
  valid: [
    // -------- already using Array.scan --------
    { code: "Array.scan(0, (acc, x) => acc + x)(arr);" },
    // -------- reduce without array accumulator --------
    { code: "arr.reduce((acc, x) => acc + x, 0);" },
    // -------- reduce with multi-element initial array (not scan pattern) --------
    { code: "arr.reduce((acc, x) => [...acc, x], [a, b]);" },
    // -------- reduce without initial value --------
    { code: "arr.reduce((acc, x) => [...acc, x]);" },
    // -------- reduce with empty initial array --------
    { code: "arr.reduce((acc, x) => [...acc, x], []);" },
    // -------- not a reduce call --------
    { code: "arr.map((x) => x + 1);" },
    // -------- reduce callback doesn't return spread array --------
    { code: "arr.reduce((acc, x) => acc.concat(x), [0]);" },
    // -------- simple ternary (not reduce at all) --------
    { code: "a ? b : c;" },
    // -------- reduce with object initial value --------
    { code: "arr.reduce((acc, x) => ({ ...acc, [x]: true }), {});" },
    // -------- reduce callback returns array literal without spread --------
    { code: "arr.reduce((acc, x) => [x], [0]);" },
    // -------- computed property access (not .reduce) --------
    { code: 'arr["reduce"]((acc, x) => [...acc, x], [0]);' },
    // -------- callback with single parameter --------
    { code: "arr.reduce((acc) => [...acc, acc], [0]);" },
    // -------- destructured acc parameter --------
    { code: "arr.reduce(([head, ...rest], x) => [[x, ...rest], x], [0]);" },
    // -------- callback is not a function --------
    { code: "arr.reduce(someVar, [0]);" },
    // -------- initial array with hole --------
    { code: "arr.reduce((acc, x) => [...acc, x], [,]);" },
    // -------- initial array with spread --------
    { code: "arr.reduce((acc, x) => [...acc, x], [...init]);" },
    // -------- spread as second element --------
    { code: "arr.reduce((acc, x) => [...acc, ...x], [0]);" },
    // -------- return statement without argument --------
    { code: "arr.reduce(function(acc, x) { return; }, [0]);" },
    // -------- block body with non-return statement --------
    { code: "arr.reduce(function(acc, x) { console.log(x); }, [0]);" },
    // -------- block body with multiple statements --------
    {
      code: "arr.reduce(function(acc, x) { console.log(x); return [...acc, x]; }, [0]);"
    },
    // -------- block body returning non-array --------
    { code: "arr.reduce(function(acc, x) { return acc + x; }, [0]);" },
    // -------- first element is not a spread --------
    { code: "arr.reduce((acc, x) => [acc, x], [0]);" },
    // -------- first element is a hole --------
    { code: "arr.reduce((acc, x) => [, x], [0]);" },
    // -------- spread of different variable --------
    { code: "arr.reduce((acc, x) => [...other, x], [0]);" },
    // -------- spread argument is not an identifier --------
    { code: "arr.reduce((acc, x) => [...obj.acc, x], [0]);" },
    // -------- second element is a hole --------
    { code: "arr.reduce((acc, x) => [...acc,,], [0]);" }
  ]
});
