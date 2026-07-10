import { RuleTester } from "eslint";

import { preferredAliasRule } from "./preferred-alias.ts";

const ruleTester = new RuleTester();

ruleTester.run("preferred-alias", preferredAliasRule as never, {
  invalid: [
    // each → forEach
    {
      code: "_.each(xs, fn)",
      errors: [{ messageId: "preferAlias" }]
    },
    {
      code: "_.eachRight(xs, fn)",
      errors: [{ messageId: "preferAlias" }]
    },
    // extend → assignIn
    {
      code: "_.extend({}, src)",
      errors: [{ messageId: "preferAlias" }]
    },
    {
      code: "_.extendWith({}, src, fn)",
      errors: [{ messageId: "preferAlias" }]
    },
    // first → head
    {
      code: "_.first(xs)",
      errors: [{ messageId: "preferAlias" }]
    },
    // entries → toPairs
    {
      code: "_.entries(obj)",
      errors: [{ messageId: "preferAlias" }]
    },
    {
      code: "_.entriesIn(obj)",
      errors: [{ messageId: "preferAlias" }]
    },
    // toJSON/valueOf → value
    {
      code: "_.toJSON(x)",
      errors: [{ messageId: "preferAlias" }]
    },
    {
      code: "_.valueOf(x)",
      errors: [{ messageId: "preferAlias" }]
    },
    // Direct import style
    {
      code: "each(xs, fn)",
      errors: [{ messageId: "preferAlias" }]
    },
    {
      code: "import each from 'lodash/each.js'; each(xs, fn)",
      errors: [{ messageId: "preferAlias" }]
    },
    // Ignore methods option (only reports if not ignored)
    {
      code: "_.first(xs)",
      errors: [{ messageId: "preferAlias" }],
      options: [{ ignoreMethods: ["each"] }]
    },
    // Suggested replacement in message data
    {
      code: "_.extend({}, src, customizer)",
      errors: [
        {
          data: { alias: "extend", method: "assignIn" },
          messageId: "preferAlias"
        }
      ]
    }
  ],
  valid: [
    // Main names are valid
    {
      code: "_.forEach(xs, fn)"
    },
    {
      code: "_.head(xs)"
    },
    {
      code: "_.assignIn({}, src)"
    },
    {
      code: "_.toPairs(obj)"
    },
    // Non-alias methods
    {
      code: "_.map(xs, fn)"
    },
    {
      code: "_.filter(xs, fn)"
    },
    // Ignored alias
    {
      code: "_.each(xs, fn)",
      options: [{ ignoreMethods: ["each"] }]
    },
    // Non-lodash calls
    {
      code: "arr.each(fn)"
    },
    {
      code: "console.log('hello')"
    },
    // Effect calls
    {
      code: "Array.map(fn)(xs)"
    }
  ]
});
