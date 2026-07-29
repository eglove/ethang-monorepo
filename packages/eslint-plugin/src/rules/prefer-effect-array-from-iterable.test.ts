import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectArrayFromIterableRule } from "./prefer-effect-array-from-iterable.ts";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaVersion: 2024, sourceType: "module" }
  }
});

ruleTester.run("prefer-effect-array-from-iterable", preferEffectArrayFromIterableRule as never, {
  invalid: [
    // -------- fromIterable: spread pattern --------
    {
      code: "const arr = [...iter];",
      errors: [{ messageId: "preferEffectArrayFromIterable" }],
      output: "const arr = Array.fromIterable(iter);"
    },
    // -------- fromIterable: Array.from() pattern --------
    {
      code: "const arr = Array.from(iterable);",
      errors: [{ messageId: "preferEffectArrayFromIterable" }],
      output: "const arr = Array.fromIterable(iterable);"
    },
    // -------- make: Array.from({length:n}, callback) pattern --------
    {
      code: "const arr = Array.from({ length: 5 }, (_, i) => i * 2);",
      errors: [{ messageId: "preferEffectMake" }],
      output: "const arr = Array.make(5, (_, i) => i * 2);"
    },
    // -------- make: [...Array(n)].map(fn) pattern --------
    {
      code: "[...Array(3)].map(x => x + 1);",
      errors: [{ messageId: "preferEffectMake" }],
      output: "Array.make(3, x => x + 1);"
    },
    // -------- allocate: new Array(n).fill(v) pattern --------
    {
      code: "const arr = new Array(5).fill(0);",
      errors: [{ messageId: "preferEffectAllocate" }],
      output: "const arr = Array.allocate(5)(0);"
    },
    // -------- allocate: with variable count and value --------
    {
      code: "const arr = new Array(count).fill(value);",
      errors: [{ messageId: "preferEffectAllocate" }],
      output: "const arr = Array.allocate(count)(value);"
    },
    // -------- spread with function call (side effects) - reports but no fix --------
    {
      code: "[...getItems()];",
      errors: [{ messageId: "preferEffectArrayFromIterable" }],
      output: null
    }
  ],
  valid: [
    // -------- already using Array.fromIterable --------
    { code: "const arr = Array.fromIterable(iter);" },
    // -------- not a spread or Array.from --------
    { code: "const arr = items;" },
    // -------- Array.from with second argument (mapping function) - out of scope --------
    { code: "Array.from(iter, fn);" },
    // -------- already using Array.allocate --------
    { code: "Array.allocate(5)(0);" },
    // -------- fill with start/end indices - out of scope --------
    { code: "new Array(5).fill(0, 1, 3);" },
    // -------- not a fill call on new Array --------
    { code: "new Array(5);" }
  ]
});
