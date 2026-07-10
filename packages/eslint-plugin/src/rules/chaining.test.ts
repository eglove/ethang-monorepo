import { RuleTester } from "eslint";

import { chainingRule } from "./chaining.ts";

const ruleTester = new RuleTester();

const NEVER = ["never"];
const ALWAYS = ["always", 3];
const IMPLICIT = ["implicit", 3];

ruleTester.run("chaining", chainingRule as never, {
  invalid: [
    // --- never mode ---
    // Chain start should use composition instead
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; chain(arr).map(fn).value()",
      errors: [{ messageId: "never" }],
      options: NEVER
    },
    // --- always mode ---
    // Deeply nested composition (3 levels) should use chaining
    {
      code: "import map from 'lodash/map.js'; import filter from 'lodash/filter.js'; import sortBy from 'lodash/sortBy.js'; map(sortBy(filter(arr, fn), fn), fn)",
      errors: [{ messageId: "always" }],
      options: ALWAYS
    },
    // --- implicit mode ---
    // Deeply nested composition with chainable methods should use chaining
    {
      code: "import map from 'lodash/map.js'; import filter from 'lodash/filter.js'; import sortBy from 'lodash/sortBy.js'; map(sortBy(filter(arr, fn), fn), fn)",
      errors: [{ messageId: "always" }],
      options: IMPLICIT
    }
  ],
  valid: [
    // --- never mode ---
    {
      code: "import map from 'lodash/map.js'; import filter from 'lodash/filter.js'; map(filter(arr, fn), fn)",
      options: NEVER
    },
    // --- always mode ---
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; import filter from 'lodash/filter.js'; chain(arr).map(fn).filter(fn).value()",
      options: ALWAYS
    },
    // chain() with no method calls after it (parent is not a method call)
    {
      code: "import chain from 'lodash/chain.js'; chain(arr)",
      options: ALWAYS
    },
    // Not deeply nested enough (only 2 levels)
    {
      code: "import map from 'lodash/map.js'; import filter from 'lodash/filter.js'; map(filter(arr, fn), fn)",
      options: ALWAYS
    },
    // --- implicit mode ---
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; import filter from 'lodash/filter.js'; chain(arr).map(fn).filter(fn).value()",
      options: IMPLICIT
    },
    // chain() with no method calls after it (parent is not a method call)
    {
      code: "import chain from 'lodash/chain.js'; chain(arr)",
      options: IMPLICIT
    },
    // Non-lodash calls
    {
      code: "arr.map(fn)",
      options: NEVER
    }
  ]
});
