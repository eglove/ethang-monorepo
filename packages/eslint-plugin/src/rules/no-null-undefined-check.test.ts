import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { noNullUndefinedCheckRule } from "./no-null-undefined-check.ts";

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

ruleTester.run("no-null-undefined-check", noNullUndefinedCheckRule as never, {
  invalid: [
    // --- x === null ---
    {
      code: "if (x === null) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "const isNull = x === null;",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },

    // --- x === undefined ---
    {
      code: "if (x === undefined) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "const isUndefined = x === undefined;",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },

    // --- Reversed: null === x ---
    {
      code: "if (null === x) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (undefined === x) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },

    // --- x !== null (negated) ---
    {
      code: "if (x !== null) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (x !== undefined) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },

    // --- Reversed negated ---
    {
      code: "if (null !== x) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (undefined !== x) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },

    // --- Loose equality ---
    {
      code: "if (x == null) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (x == undefined) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (null == x) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (undefined == x) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },

    // --- Loose inequality ---
    {
      code: "if (x != null) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (x != undefined) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (null != x) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (undefined != x) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },

    // --- typeof checks ---
    {
      code: "if (typeof x === 'undefined') { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if ('undefined' === typeof x) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (typeof x !== 'undefined') { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if ('undefined' !== typeof x) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },

    // --- Complex expressions ---
    {
      code: "const result = obj.value === null ? 'empty' : 'has value';",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "while (input !== undefined) { process(input); }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "return config.port != null ? config.port : 3000;",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },

    // --- Nested expressions ---
    {
      code: "const check = (x) => x === null;",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "const check = (x) => x === undefined;",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "const check = (x) => typeof x === 'undefined';",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },

    // --- Member expressions ---
    {
      code: "if (obj.prop === null) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (obj.prop === undefined) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (obj.prop != null) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    },
    {
      code: "if (obj.prop != undefined) { return; }",
      errors: [{ messageId: "noNullUndefinedCheck" }]
    }
  ],
  valid: [
    // --- Using isNil ---
    {
      code: "if (isNil(x)) { return; }"
    },
    {
      code: "if (!isNil(x)) { return; }"
    },
    {
      code: "const isEmpty = isNil(x);"
    },

    // --- Other comparisons that should not trigger ---
    {
      code: "if (x === null || x === undefined) { return; }"
    },
    {
      code: "if (x > 0) { return; }"
    },
    {
      code: "if (x === 0) { return; }"
    },
    {
      code: "if (x === '') { return; }"
    },
    {
      code: "if (x === false) { return; }"
    },
    {
      code: "typeof x === 'string'"
    },
    {
      code: "typeof x === 'number'"
    },
    {
      code: "if (x == 0) { return; }"
    },
    {
      code: "if (x != 0) { return; }"
    },

    // --- Non-comparison uses of null/undefined ---
    {
      code: "const x = null;"
    },
    {
      code: "const x = undefined;"
    },
    {
      code: "function fn(x = null) {}"
    },
    {
      code: "function fn(x = undefined) {}"
    },

    // --- isNil already imported and used ---
    {
      code: 'import isNil from "lodash/isNil.js"; if (isNil(x)) { return; }'
    }
  ]
});
