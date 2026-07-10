import { RuleTester } from "eslint";

import { matchesPropertyShorthandRule } from "./matches-property-shorthand.ts";

const ruleTester = new RuleTester();

ruleTester.run(
  "matches-property-shorthand",
  matchesPropertyShorthandRule as never,
  {
    invalid: [
      // Simple single equality — x => x.id === 3
      {
        code: "_.filter(users, x => x.id === 3)",
        errors: [{ messageId: "preferMatchesPropShorthand" }]
      },
      // Function expression with return
      {
        code: "_.filter(users, function(x) { return x.id === 3; })",
        errors: [{ messageId: "preferMatchesPropShorthand" }]
      },
      // Nested property equality — x => x.user.id === 3
      {
        code: "_.filter(users, x => x.user.id === 3)",
        errors: [{ messageId: "preferMatchesPropShorthand" }]
      },
      // Right side member expression — x => 3 === x.id
      {
        code: "_.filter(users, x => 3 === x.id)",
        errors: [{ messageId: "preferMatchesPropShorthand" }]
      },
      // _.matchesProperty call as iteratee
      {
        code: "_.filter(users, _.matchesProperty('id', 3))",
        errors: [{ messageId: "preferMatchesPropShorthand" }]
      },
      // lodash.matchesProperty call as iteratee
      {
        code: "lodash.filter(users, lodash.matchesProperty('id', 3))",
        errors: [{ messageId: "preferMatchesPropShorthand" }]
      },
      // Direct import style
      {
        code: "filter(users, x => x.id === 3)",
        errors: [{ messageId: "preferMatchesPropShorthand" }]
      },
      // 'never' option — array literal should be flagged
      {
        code: "_.filter(users, ['id', 3])",
        errors: [{ messageId: "noMatchesPropShorthand" }],
        options: ["never"]
      },
      // 'never' option with lodash direct import
      {
        code: "filter(users, ['id', 3])",
        errors: [{ messageId: "noMatchesPropShorthand" }],
        options: ["never"]
      },
      // onlyLiterals false (default) — variable comparison should flag
      {
        code: "_.filter(users, x => x.id === currentId)",
        errors: [{ messageId: "preferMatchesPropShorthand" }]
      }
    ],
    valid: [
      // Non-equality return — should not flag
      {
        code: "_.map(users, x => x.name)"
      },
      // Non-strict equality (==) should not flag
      {
        code: "_.filter(users, x => x.id == 3)"
      },
      // Equality but not against member of parameter
      {
        code: "_.filter(users, x => a === b)"
      },
      // Array literal with default 'always' — valid (already using shorthand)
      {
        code: "_.filter(users, ['id', 3])"
      },
      // Non-shorthand methods — equality iteratee is fine
      {
        code: "_.reduce(users, x => x.id === 3)"
      },
      // 'never' option — explicit function is valid
      {
        code: "_.filter(users, x => x.id === 3)",
        options: ["never"]
      },
      // Non-lodash calls
      {
        code: "console.log('hello')"
      },
      // Conjunction of equalities — that's matches-shorthand, not matches-prop
      {
        code: "_.filter(users, x => x.a === 1 && x.b === 2)"
      },
      // onlyLiterals — variable comparison should not flag
      {
        code: "_.filter(users, x => x.id === currentId)",
        options: ["always", { onlyLiterals: true }]
      },
      // Non-literal on both sides with onlyLiterals
      {
        code: "_.filter(users, x => x.id === otherId)",
        options: ["always", { onlyLiterals: true }]
      },
      // Single argument — no iteratee to check
      {
        code: "_.filter(users)"
      }
    ]
  }
);
