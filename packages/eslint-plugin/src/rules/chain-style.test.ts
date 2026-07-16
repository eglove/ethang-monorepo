import { RuleTester } from "eslint";

import { chainStyleRule } from "./chain-style.ts";

const ruleTester = new RuleTester();

const AS_NEEDED = ["as-needed"];
const IMPLICIT = ["implicit"];
const EXPLICIT = ["explicit"];

ruleTester.run("chain-style", chainStyleRule as never, {
  invalid: [
    // --- as-needed mode ---
    // Explicit chain with only chainable methods is unnecessary
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; import filter from 'lodash/filter.js'; chain(arr).map(fn).filter(fn).value()",
      errors: [{ messageId: "unnecessary" }],
      options: AS_NEEDED
    },
    // --- implicit mode ---
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; chain(arr).map(fn).value()",
      errors: [{ messageId: "noExplicit" }],
      options: IMPLICIT
    },
    // --- explicit mode ---
    // Implicit chain (nested composition) should use explicit chaining
    {
      code: "import map from 'lodash/map.js'; import filter from 'lodash/filter.js'; map(filter(arr, fn), fn)",
      errors: [{ messageId: "noImplicit" }],
      options: EXPLICIT
    }
  ],
  valid: [
    // --- as-needed mode ---
    // Explicit chain with a non-chainable method followed by more chainable methods is needed
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; import add from 'lodash/add.js'; chain(arr).map(fn).add(1).map(fn).value()",
      options: AS_NEEDED
    },
    // Explicit chain with non-chainable method right before chain breaker is needed
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; import add from 'lodash/add.js'; chain(arr).map(fn).add(1).value()",
      options: AS_NEEDED
    },
    // Non-chain calls
    {
      code: "import map from 'lodash/map.js'; map(arr, fn)",
      options: AS_NEEDED
    },
    // --- implicit mode ---
    {
      code: "import map from 'lodash/map.js'; import filter from 'lodash/filter.js'; map(filter(arr, fn), fn)",
      options: IMPLICIT
    },
    // --- explicit mode ---
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; chain(arr).map(fn).value()",
      options: EXPLICIT
    }
  ]
});
