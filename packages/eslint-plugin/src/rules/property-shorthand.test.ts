import { RuleTester } from "eslint";

import { propertyShorthandRule } from "./property-shorthand.ts";

const ruleTester = new RuleTester();

ruleTester.run("property-shorthand", propertyShorthandRule as never, {
  invalid: [
    // Arrow function returning property — x => x.name
    {
      code: "_.map(xs, x => x.name)",
      errors: [{ messageId: "preferPropertyShorthand" }]
    },
    // Function expression returning property
    {
      code: "_.filter(xs, function(x) { return x.active; })",
      errors: [{ messageId: "preferPropertyShorthand" }]
    },
    // Arrow with block returning property
    {
      code: "_.map(xs, x => { return x.name; })",
      errors: [{ messageId: "preferPropertyShorthand" }]
    },
    // Nested property — x => x.user.name
    {
      code: "_.map(xs, x => x.user.name)",
      errors: [{ messageId: "preferPropertyShorthand" }]
    },
    // _.property call as iteratee
    {
      code: "_.map(xs, _.property('name'))",
      errors: [{ messageId: "preferPropertyShorthand" }]
    },
    // lodash.property call as iteratee
    {
      code: "lodash.map(xs, lodash.property('name'))",
      errors: [{ messageId: "preferPropertyShorthand" }]
    },
    // Direct import style
    {
      code: "map(xs, x => x.name)",
      errors: [{ messageId: "preferPropertyShorthand" }]
    },
    // sortBy supports prop shorthand (prop-only method)
    {
      code: "_.sortBy(xs, x => x.age)",
      errors: [{ messageId: "preferPropertyShorthand" }]
    },
    {
      code: "_.filter(xs, x => x.active)",
      errors: [{ messageId: "preferPropertyShorthand" }]
    },
    // 'never' option — string shorthand should be flagged
    {
      code: "_.map(xs, 'name')",
      errors: [{ messageId: "noPropertyShorthand" }],
      options: ["never"]
    },
    {
      code: "_.filter(xs, 'active')",
      errors: [{ messageId: "noPropertyShorthand" }],
      options: ["never"]
    }
  ],
  valid: [
    // Non-property iteratee — should not flag
    {
      code: "_.map(xs, x => x * 2)"
    },
    {
      code: "_.filter(xs, x => x > 0)"
    },
    // Identity function — not a property access
    {
      code: "_.filter(xs, x => x)"
    },
    // String shorthand with default 'always' — valid
    {
      code: "_.map(xs, 'name')"
    },
    {
      code: "_.filter(xs, 'active')"
    },
    // Non-shorthand methods — property iteratee is fine
    {
      code: "_.reduce(xs, x => x.name)"
    },
    // 'never' option — explicit property function is valid
    {
      code: "_.map(xs, x => x.name)",
      options: ["never"]
    },
    {
      code: "_.filter(xs, function(x) { return x.active; })",
      options: ["never"]
    },
    // Non-lodash calls
    {
      code: "console.log('hello')"
    },
    // Computed property access — not shorthand (allowComputed: false)
    {
      code: "_.map(xs, x => x[key])"
    },
    // Non-member return value (e.g. literal)
    {
      code: "_.map(xs, x => 42)"
    },
    // Member expression with non-identifier property — not flagged
    {
      code: "_.map(xs, _['name'])"
    }
  ]
});
