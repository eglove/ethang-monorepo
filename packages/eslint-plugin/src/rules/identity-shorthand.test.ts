import { RuleTester } from "eslint";

import { identityShorthandRule } from "./identity-shorthand.ts";

const ruleTester = new RuleTester();

ruleTester.run("identity-shorthand", identityShorthandRule as never, {
  invalid: [
    // Explicit identity function — function(x) { return x; }
    {
      code: "_.filter(xs, function(x) { return x; })",
      errors: [{ messageId: "preferOmitIdentity" }]
    },
    // Arrow function identity — x => x
    {
      code: "_.filter(xs, x => x)",
      errors: [{ messageId: "preferOmitIdentity" }]
    },
    // Arrow function with block — x => { return x; }
    {
      code: "_.map(xs, x => { return x; })",
      errors: [{ messageId: "preferOmitIdentity" }]
    },
    // _.identity as iteratee
    {
      code: "_.filter(xs, _.identity)",
      errors: [{ messageId: "preferOmitIdentity" }]
    },
    // lodash.identity as iteratee (covers lodash pragma branch)
    {
      code: "lodash.filter(xs, lodash.identity)",
      errors: [{ messageId: "preferOmitIdentity" }]
    },
    // Various shorthand-supporting methods
    {
      code: "_.some(xs, function(x) { return x; })",
      errors: [{ messageId: "preferOmitIdentity" }]
    },
    {
      code: "_.every(xs, x => x)",
      errors: [{ messageId: "preferOmitIdentity" }]
    },
    {
      code: "_.find(xs, x => x)",
      errors: [{ messageId: "preferOmitIdentity" }]
    },
    {
      code: "_.reject(xs, x => x)",
      errors: [{ messageId: "preferOmitIdentity" }]
    },
    // 'never' option — using shorthand (no iteratee) should be flagged
    {
      code: "_.filter(xs)",
      errors: [{ messageId: "noIdentityShorthand" }],
      options: ["never"]
    },
    {
      code: "_.map(xs)",
      errors: [{ messageId: "noIdentityShorthand" }],
      options: ["never"]
    },
    // Direct import style
    {
      code: "filter(xs, x => x)",
      errors: [{ messageId: "preferOmitIdentity" }]
    }
  ],
  valid: [
    // Non-identity iteratee — should not flag
    {
      code: "_.filter(xs, x => x > 0)"
    },
    {
      code: "_.map(xs, x => x * 2)"
    },
    // Function that does not return its first param
    {
      code: "_.filter(xs, function(x) { return x.active; })"
    },
    // No iteratee (shorthand) with default 'always' — valid
    {
      code: "_.filter(xs)"
    },
    {
      code: "_.map(xs)"
    },
    // No iteratee on shorthand method with explicit 'always'
    {
      code: "_.some(xs)",
      options: ["always"]
    },
    // Non-shorthand methods — identity iteratee is fine
    {
      code: "_.reduce(xs, function(x) { return x; })"
    },
    // 'never' option — explicit identity function is valid
    {
      code: "_.filter(xs, x => x)",
      options: ["never"]
    },
    {
      code: "_.map(xs, _.identity)",
      options: ["never"]
    },
    // Non-lodash calls
    {
      code: "console.log('hello')"
    },
    // Non-shorthand method with identity — valid (not flagged)
    {
      code: "_.sortBy(xs, x => x)"
    },
    // Function expression with non-return first statement — not identity
    {
      code: "_.filter(xs, function(x) { var y = 1; return x; })"
    },
    // Arrow with block where first statement is not return — not identity
    {
      code: "_.filter(xs, x => { var y = 1; return x; })"
    },
    // Function with rest param — first param not Identifier
    {
      code: "_.filter(xs, function(...args) { return args; })"
    },
    // Function with no params — first param undefined
    {
      code: "_.filter(xs, function() { return true; })"
    },
    // Member expression that's not _.identity — not flagged
    {
      code: "_.filter(xs, _.foo)"
    },
    // Member expression with non-identifier property — not flagged
    {
      code: "_.filter(xs, _['identity'])"
    },
    // Arrow with block and bare return — first.argument is null (covers ?? undefined branch)
    {
      code: "_.filter(xs, x => { return; })"
    },
    // Function expression with bare return — first.argument is null (covers ?? undefined branch)
    {
      code: "_.filter(xs, function(x) { return; })"
    },
    // 'never' option with explicit iteratee — covers checkNever false branch
    {
      code: "_.filter(xs, x => x > 0)",
      options: ["never"]
    }
  ]
});
