import { RuleTester } from "eslint";

import { consistentComposeRule } from "./consistent-compose.ts";

const ruleTester = new RuleTester();

ruleTester.run("consistent-compose", consistentComposeRule as never, {
  invalid: [
    // Default direction is 'flow' (LTR), so flowRight/compose should be flagged
    {
      code: "_.flowRight(f, g)",
      errors: [{ messageId: "preferComposeDirection" }]
    },
    {
      code: "_.compose(f, g)",
      errors: [{ messageId: "preferComposeDirection" }]
    },
    // Explicit 'flow' direction — same as default but with options
    {
      code: "_.flowRight(fn1, fn2)",
      errors: [{ messageId: "preferComposeDirection" }],
      options: ["flow"]
    },
    {
      code: "_.compose(fn1, fn2)",
      errors: [{ messageId: "preferComposeDirection" }],
      options: ["flow"]
    },
    // Explicit 'flowRight' direction — flow/pipe should be flagged
    {
      code: "_.flow(f, g)",
      errors: [{ messageId: "preferComposeDirection" }],
      options: ["flowRight"]
    },
    {
      code: "_.pipe(f, g)",
      errors: [{ messageId: "preferComposeDirection" }],
      options: ["flowRight"]
    },
    // Explicit 'pipe' direction (same group as flow)
    {
      code: "_.flowRight(fnA, fnB)",
      errors: [{ messageId: "preferComposeDirection" }],
      options: ["pipe"]
    },
    {
      code: "_.compose(fnA, fnB)",
      errors: [{ messageId: "preferComposeDirection" }],
      options: ["pipe"]
    },
    // Explicit 'compose' direction (same group as flowRight)
    {
      code: "_.flow(fn1, fn2)",
      errors: [{ messageId: "preferComposeDirection" }],
      options: ["compose"]
    },
    {
      code: "_.pipe(fn1, fn2)",
      errors: [{ messageId: "preferComposeDirection" }],
      options: ["compose"]
    },
    // Direct import style (only flow/flowRight are in lodash core)
    {
      code: "flowRight(f, g)",
      errors: [{ messageId: "preferComposeDirection" }]
    },
    {
      code: "import flowRight from 'lodash/flowRight.js'; flowRight(fn1, fn2)",
      errors: [{ messageId: "preferComposeDirection" }]
    },
    // Message data includes preferred direction
    {
      code: "_.flowRight(h, i)",
      errors: [
        {
          data: { method: "flowRight", preferred: "flow" },
          messageId: "preferComposeDirection"
        }
      ]
    }
  ],
  valid: [
    // Default direction is 'flow' — flow and pipe are valid
    {
      code: "_.flow(f, g)"
    },
    {
      code: "_.pipe(f, g)"
    },
    // Explicit 'flow' direction
    {
      code: "_.flow(fn1, fn2)",
      options: ["flow"]
    },
    {
      code: "_.pipe(fn1, fn2)",
      options: ["flow"]
    },
    // Explicit 'flowRight' direction
    {
      code: "_.flowRight(f, g)",
      options: ["flowRight"]
    },
    {
      code: "_.compose(f, g)",
      options: ["flowRight"]
    },
    // Explicit 'pipe' direction
    {
      code: "_.flow(fnA, fnB)",
      options: ["pipe"]
    },
    {
      code: "_.pipe(fnA, fnB)",
      options: ["pipe"]
    },
    // Explicit 'compose' direction
    {
      code: "_.flowRight(fn1, fn2)",
      options: ["compose"]
    },
    {
      code: "_.compose(fn1, fn2)",
      options: ["compose"]
    },
    // Non-compose methods are not flagged
    {
      code: "_.map(xs, fn)"
    },
    {
      code: "_.filter(xs, fn)"
    },
    // Non-lodash calls
    {
      code: "console.log('hello')"
    },
    // Direct import style — valid (only flow/flowRight in lodash core)
    {
      code: "import flow from 'lodash/flow.js'; flow(f, g)"
    },
    {
      code: "import flowRight from 'lodash/flowRight.js'; flowRight(fn1, fn2)",
      options: ["flowRight"]
    }
  ]
});
