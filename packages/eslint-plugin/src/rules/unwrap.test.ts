import { RuleTester } from "eslint";
import { describe, expect, it } from "vitest";

import { unwrapRule } from "./unwrap.ts";

const ruleTester = new RuleTester();

ruleTester.run("unwrap", unwrapRule as never, {
  invalid: [
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; chain(arr).map(fn);",
      errors: [{ messageId: "missing" }]
    },
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; import reduce from 'lodash/reduce.js'; chain(arr).map(fn).reduce(g, init);",
      errors: [{ messageId: "missing" }]
    }
  ],
  valid: [
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; chain(arr).map(fn).value();"
    },
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; import filter from 'lodash/filter.js'; chain(arr).map(fn).filter(fn2).value();"
    },
    {
      code: "import map from 'lodash/map.js'; map(arr, fn);"
    },
    {
      code: "import chain from 'lodash/chain.js'; import map from 'lodash/map.js'; chain(arr).map(fn).commit();"
    },
    {
      code: "chain(arr).map(fn).value();"
    }
  ]
});

describe("unwrap metadata", () => {
  it("has correct rule name", () => {
    expect(unwrapRule.name).toBe("unwrap");
  });

  it("has correct message id", () => {
    expect(unwrapRule.meta.messages.missing).toBe(
      "Missing unwrapping at end of chain"
    );
  });

  it("is a problem type rule", () => {
    expect(unwrapRule.meta.type).toBe("problem");
  });

  it("has docs description", () => {
    expect(unwrapRule.meta.docs?.description).toBe(
      "Require lodash chains to end with a chain-breaking method"
    );
  });
});
