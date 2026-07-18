import { RuleTester } from "eslint";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashTakeRule } from "./prefer-lodash-take.ts";

const pluginDirectory = import.meta.dirname;

const fixturesRoot = path.join(
  pluginDirectory,
  ".fixtures",
  "prefer-lodash-take"
);
const fixture = (name: string) => {
  return {
    code: "",
    filename: path.join(fixturesRoot, `${name}.fixture.ts`)
  };
};

const MESSAGE_ID = "preferLodashTake" as const;

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

ruleTester.run("prefer-lodash-take", preferLodashTakeRule as never, {
  invalid: [
    // -------- take: literal count --------
    {
      code: "arr.slice(0, 3);",
      errors: [{ messageId: MESSAGE_ID }],
      output: 'import take from "lodash/take.js";\ntake(arr, 3);'
    },

    // -------- take: identifier count --------
    {
      code: "data.slice(0, n);",
      errors: [{ messageId: MESSAGE_ID }],
      output: 'import take from "lodash/take.js";\ntake(data, n);'
    },

    // -------- takeRight: literal count --------
    {
      code: "xs.slice(-2);",
      errors: [{ messageId: MESSAGE_ID }],
      output: 'import takeRight from "lodash/takeRight.js";\ntakeRight(xs, 2);'
    },

    // -------- takeRight: identifier count --------
    {
      code: "xs.slice(-n);",
      errors: [{ messageId: MESSAGE_ID }],
      output: 'import takeRight from "lodash/takeRight.js";\ntakeRight(xs, n);'
    },

    // -------- take: assigned to a variable --------
    {
      code: "const head = arr.slice(0, 2);",
      errors: [{ messageId: MESSAGE_ID }],
      output: 'import take from "lodash/take.js";\nconst head = take(arr, 2);'
    }
  ],

  valid: [
    // -------- already lodash --------
    "take(arr, 3);",
    "takeRight(arr, 2);",

    // -------- drop shapes (out of scope, handled by a future rule) --------
    "arr.slice(1);",
    "arr.slice(1, 3);",
    "arr.slice(-1, 2);",
    "arr.slice(n);",

    // -------- no args --------
    "arr.slice();",

    // -------- computed member --------
    'arr["slice"](0, 2);',

    // -------- non-slice member --------
    "arr.splice(0, 2);",

    // -------- eslint-disable is honored --------
    fixture("valid-eslint-disable")
  ]
});
