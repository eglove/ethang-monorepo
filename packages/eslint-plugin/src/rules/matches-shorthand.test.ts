import { RuleTester } from "eslint";

import { matchesShorthandRule } from "./matches-shorthand.ts";

const ruleTester = new RuleTester();

ruleTester.run("matches-shorthand", matchesShorthandRule as never, {
  invalid: [
    // Simple single equality — x => x.active === true
    {
      code: "_.filter(xs, x => x.active === true)",
      errors: [{ messageId: "preferMatchesShorthand" }]
    },
    // Conjunction of equalities — x => x.active === true && x.role === 'admin'
    {
      code: "_.filter(xs, x => x.active === true && x.role === 'admin')",
      errors: [{ messageId: "preferMatchesShorthand" }]
    },
    // Function expression with return
    {
      code: "_.filter(xs, function(x) { return x.active === true && x.role === 'admin'; })",
      errors: [{ messageId: "preferMatchesShorthand" }]
    },
    // Nested property equality — x => x.user.name === 'alice'
    {
      code: "_.map(xs, x => x.user.name === 'alice')",
      errors: [{ messageId: "preferMatchesShorthand" }]
    },
    // _.matches call as iteratee
    {
      code: "_.filter(xs, _.matches({ active: true }))",
      errors: [{ messageId: "preferMatchesShorthand" }]
    },
    // lodash.matches call as iteratee
    {
      code: "lodash.filter(xs, lodash.matches({ active: true }))",
      errors: [{ messageId: "preferMatchesShorthand" }]
    },
    // Direct import style
    {
      code: "filter(xs, x => x.active === true)",
      errors: [{ messageId: "preferMatchesShorthand" }]
    },
    // Right side member expression — x => true === x.active
    {
      code: "_.filter(xs, x => true === x.active)",
      errors: [{ messageId: "preferMatchesShorthand" }]
    },
    // Three-way conjunction
    {
      code: "_.filter(xs, x => x.a === 1 && x.b === 2 && x.c === 3)",
      errors: [{ messageId: "preferMatchesShorthand" }]
    },
    // 'never' option — object literal should be flagged
    {
      code: "_.filter(xs, { active: true })",
      errors: [{ messageId: "noMatchesShorthand" }],
      options: ["never"]
    },
    {
      code: "_.filter(xs, { active: true, role: 'admin' })",
      errors: [{ messageId: "noMatchesShorthand" }],
      options: ["never"]
    }
  ],
  valid: [
    // Non-equality return — should not flag
    {
      code: "_.map(xs, x => x.name)"
    },
    // Non-conjunction — single property access, not equality
    {
      code: "_.filter(xs, x => x > 0)"
    },
    // Equality but not against member of parameter
    {
      code: "_.filter(xs, x => a === b)"
    },
    // Object literal with default 'always' — valid (already using shorthand)
    {
      code: "_.filter(xs, { active: true })"
    },
    // Non-shorthand methods — equality iteratee is fine
    {
      code: "_.reduce(xs, x => x.active === true)"
    },
    // 'never' option — explicit function is valid
    {
      code: "_.filter(xs, x => x.active === true)",
      options: ["never"]
    },
    // Non-lodash calls
    {
      code: "console.log('hello')"
    },
    // Computed property access — not shorthand by default
    {
      code: "_.filter(xs, x => x['active'] === true)"
    },
    // maxPropertyPathLength=1 — nested property too deep
    {
      code: "_.map(xs, x => x.user.name === 'alice')",
      options: ["always", 1]
    },
    // onlyLiterals — variable comparison should not flag
    {
      code: "_.filter(xs, x => x.active === flag)",
      options: ["always", 3, false, { onlyLiterals: true }]
    },
    // Single argument — no iteratee to check
    {
      code: "_.filter(xs)"
    }
  ]
});
