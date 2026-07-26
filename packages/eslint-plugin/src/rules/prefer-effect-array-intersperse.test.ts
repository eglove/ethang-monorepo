import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectArrayIntersperseRule } from "./prefer-effect-array-intersperse.ts";

const MESSAGE_ID = "preferEffectArrayIntersperse";
const CANONICAL_OUTPUT = "Array.intersperse(sep)(arr);";

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
  "prefer-effect-array-intersperse",
  preferEffectArrayIntersperseRule as never,
  {
    invalid: [
      // -------- canonical flatMap intersperse pattern --------
      {
        code: "arr.flatMap((x, i) => i === 0 ? [x] : [sep, x]);",
        errors: [{ messageId: MESSAGE_ID }],
        output: CANONICAL_OUTPUT
      },
      // -------- with different variable names --------
      {
        code: "items.flatMap((item, index) => index === 0 ? [item] : [separator, item]);",
        errors: [{ messageId: MESSAGE_ID }],
        output: "Array.intersperse(separator)(items);"
      },
      // -------- with block body and return --------
      {
        code: "arr.flatMap((x, i) => { return i === 0 ? [x] : [sep, x]; });",
        errors: [{ messageId: MESSAGE_ID }],
        output: CANONICAL_OUTPUT
      },
      // -------- function expression --------
      {
        code: "arr.flatMap(function(x, i) { return i === 0 ? [x] : [sep, x]; });",
        errors: [{ messageId: MESSAGE_ID }],
        output: CANONICAL_OUTPUT
      },
      // -------- with complex separator expression --------
      {
        code: "arr.flatMap((x, i) => i === 0 ? [x] : [', ', x]);",
        errors: [{ messageId: MESSAGE_ID }],
        output: "Array.intersperse(', ')(arr);"
      },
      // -------- nested array access --------
      {
        code: "data.values.flatMap((v, idx) => idx === 0 ? [v] : [delimiter, v]);",
        errors: [{ messageId: MESSAGE_ID }],
        output: "Array.intersperse(delimiter)(data.values);"
      },
      // -------- with three params (index, array) --------
      {
        code: "arr.flatMap((x, i, a) => i === 0 ? [x] : [sep, x]);",
        errors: [{ messageId: MESSAGE_ID }],
        output: CANONICAL_OUTPUT
      }
    ],
    valid: [
      // -------- already using Array.intersperse --------
      { code: "Array.intersperse(sep)(arr);" },
      // -------- flatMap without index check --------
      { code: "arr.flatMap(x => [x, x * 2]);" },
      // -------- flatMap with index but not i === 0 --------
      { code: "arr.flatMap((x, i) => i > 0 ? [x] : [sep, x]);" },
      // -------- flatMap with i !== 0 --------
      { code: "arr.flatMap((x, i) => i !== 0 ? [x] : [sep, x]);" },
      // -------- flatMap with wrong comparison order --------
      { code: "arr.flatMap((x, i) => 0 === i ? [x] : [sep, x]);" },
      // -------- flatMap where first element is not [x] --------
      { code: "arr.flatMap((x, i) => i === 0 ? [transform(x)] : [sep, x]);" },
      // -------- flatMap where second element is not [sep, x] --------
      { code: "arr.flatMap((x, i) => i === 0 ? [x] : [sep, transform(x)]);" },
      // -------- not a flatMap call --------
      { code: "arr.map((x, i) => i === 0 ? [x] : [sep, x]);" },
      // -------- flatMap with only one param --------
      { code: "arr.flatMap(x => [x]);" },
      // -------- simple ternary (not flatMap) --------
      { code: "a ? b : c;" },
      // -------- flatMap returning non-array --------
      { code: "arr.flatMap((x, i) => i === 0 ? x : [sep, x]);" },
      // -------- flatMap with spread in consequent --------
      { code: "arr.flatMap((x, i) => i === 0 ? [...x] : [sep, x]);" },
      // -------- flatMap with spread in alternate --------
      { code: "arr.flatMap((x, i) => i === 0 ? [x] : [...sep, x]);" },
      // -------- flatMap with different constant in i === N --------
      { code: "arr.flatMap((x, i) => i === 1 ? [x] : [sep, x]);" },
      // -------- flatMap with i !== 0 --------
      { code: "arr.flatMap((x, i) => i !== 0 ? [sep, x] : [x]);" },
      // -------- callback body has multiple statements --------
      {
        code: "arr.flatMap((x, i) => { const y = i === 0; return y ? [x] : [sep, x]; });"
      },
      // -------- computed property access (not .flatMap) --------
      { code: 'arr["flatMap"]((x, i) => i === 0 ? [x] : [sep, x]);' },
      // -------- destructured element param --------
      {
        code: "arr.flatMap(([head, ...rest], i) => i === 0 ? [[head, ...rest]] : [sep, [head, ...rest]]);"
      },
      // -------- flatMap with no args --------
      { code: "arr.flatMap();" },
      // -------- ternary with 3-element arrays --------
      {
        code: "arr.flatMap((x, i) => i === 0 ? [x, extra] : [sep, x, extra]);"
      },
      // -------- ternary consequent is a hole --------
      { code: "arr.flatMap((x, i) => i === 0 ? [,] : [sep, x]);" },
      // -------- ternary alternate is a hole --------
      { code: "arr.flatMap((x, i) => i === 0 ? [x] : [,]);" }
    ]
  }
);
