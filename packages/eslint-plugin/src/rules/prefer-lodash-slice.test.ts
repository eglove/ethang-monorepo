import { RuleTester } from "eslint";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashSliceRule } from "./prefer-lodash-slice.ts";

const pluginDirectory = import.meta.dirname;

const fixturesRoot = path.join(
  pluginDirectory,
  ".fixtures",
  "prefer-lodash-slice"
);
const fixture = (name: string) => {
  return {
    code: "",
    filename: path.join(fixturesRoot, `${name}.fixture.ts`)
  };
};

// Every case is type-checked against this in-project virtual file so the
// rule's type-aware receiver guard can resolve `String` vs `Array` receivers.
// Type information is taken from each case's inline `code`, not from the file
// contents. A clean anchor (without any `.slice()` calls) is used for valid
// cases so the rule does not autofix code from the fixture file itself.
const typedFixture = path.join(fixturesRoot, "valid-eslint-disable.fixture.ts");
const typedAnchor = path.join(fixturesRoot, "typed-anchor.fixture.ts");
const withFile = <T extends { code: string }>(caseItem: T) => {
  return { ...caseItem, filename: typedFixture };
};
const withAnchor = <T extends { code: string }>(caseItem: T) => {
  return { ...caseItem, filename: typedAnchor };
};

const MESSAGE_ID = "preferLodashSlice" as const;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 2024,
      project: path.join(pluginDirectory, "..", "..", "tsconfig.test.json"),
      sourceType: "module"
    }
  }
});

ruleTester.run("prefer-lodash-slice", preferLodashSliceRule as never, {
  invalid: [
    // -------- prefix: literal count --------
    withFile({
      code: "arr.slice(0, 3);",
      errors: [{ messageId: MESSAGE_ID }],
      output: 'import slice from "lodash/slice.js";\nslice(arr, 0, 3);'
    }),

    // -------- prefix: identifier count --------
    withFile({
      code: "data.slice(0, n);",
      errors: [{ messageId: MESSAGE_ID }],
      output: 'import slice from "lodash/slice.js";\nslice(data, 0, n);'
    }),

    // -------- suffix: literal count --------
    withFile({
      code: "xs.slice(-2);",
      errors: [{ messageId: MESSAGE_ID }],
      output: 'import slice from "lodash/slice.js";\nslice(xs, -2);'
    }),

    // -------- suffix: identifier count --------
    withFile({
      code: "xs.slice(-n);",
      errors: [{ messageId: MESSAGE_ID }],
      output: 'import slice from "lodash/slice.js";\nslice(xs, -n);'
    }),

    // -------- prefix: assigned to a variable --------
    withFile({
      code: "const head = arr.slice(0, 2);",
      errors: [{ messageId: MESSAGE_ID }],
      output:
        'import slice from "lodash/slice.js";\nconst head = slice(arr, 0, 2);'
    }),

    // -------- lodash/slice already imported: no import fix --------
    withFile({
      code: 'import slice from "lodash/slice.js";\nconst head = arr.slice(0, 2);',
      errors: [{ messageId: MESSAGE_ID }],
      output:
        'import slice from "lodash/slice.js";\nconst head = slice(arr, 0, 2);'
    })
  ],

  valid: [
    // -------- already lodash --------
    withAnchor({ code: "slice(arr, 0, 3);" }),
    withAnchor({ code: "slice(arr, -2);" }),

    // -------- drop shapes (out of scope, handled by a future rule) --------
    withAnchor({ code: "arr.slice(1);" }),
    withAnchor({ code: "arr.slice(1, 3);" }),
    withAnchor({ code: "arr.slice(-1, 2);" }),
    withAnchor({ code: "arr.slice(n);" }),

    // -------- no args --------
    withAnchor({ code: "arr.slice();" }),

    // -------- computed member --------
    withAnchor({ code: 'arr["slice"](0, 2);' }),

    // -------- non-slice member --------
    withAnchor({ code: "arr.splice(0, 2);" }),

    // -------- string receivers use a string-aware helper (e.g. split) --------
    withFile({ code: 'const name = location.split("(")[0];' }),

    // -------- string receivers are left alone: lodash slice coerces to string[] --------
    withFile({ code: 'const s = "hello"; s.slice(0, 2);' }),
    withFile({ code: 'const s = "hello"; s.slice(-2);' }),
    withFile({
      code: 'const greeting: string = "hello"; greeting.slice(0, 2);'
    }),
    withFile({
      code: 'const parts: string[] = ["a", "b"]; parts.join("").slice(0, 2);'
    }),
    withFile({
      code: "function f(label: string) { return label.slice(0, 3); }"
    }),

    // -------- eslint-disable is honored --------
    fixture("valid-eslint-disable")
  ]
});
