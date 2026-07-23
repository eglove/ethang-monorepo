import keys from "lodash/keys.js";
import sortBy from "lodash/sortBy.js";
import values from "lodash/values.js";
import { describe, expect, it } from "vitest";

import plugin, { rules } from "./index.ts";

const sortNames = (names: readonly string[]) => {
  return sortBy([...names]);
};

describe("plugin", () => {
  it("exports the expected rule names", () => {
    expect(sortNames(keys(rules))).toStrictEqual(
      sortNames([
        "chain-style",
        "chaining",
        "consistent-compose",
        "identity-shorthand",
        "import-scope",
        "matches-property-shorthand",
        "matches-shorthand",
        "no-barrel-file",
        "no-collection-issues",
        "no-explicit-return-type",
        "no-lodash-misuse",
        "no-null-undefined-check",
        "no-try-catch",
        "path-style",
        "prefer-effect-datetime",
        "prefer-effect-encoding-base64",
        "prefer-effect-log",
        "prefer-effect-predicate",
        "prefer-effect-predicate-is-iterable",
        "prefer-lodash",
        "prefer-lodash-clamp",
        "prefer-lodash-escape-regexp",
        "prefer-lodash-count-by",
        "prefer-lodash-difference",
        "prefer-lodash-find-key",
        "prefer-lodash-from-pairs",
        "prefer-lodash-group-by",
        "prefer-lodash-intersection",
        "prefer-lodash-key-by",
        "prefer-lodash-slice",
        "prefer-lodash-union",
        "prefer-lodash-uniq",
        "preferred-alias",
        "property-shorthand",
        "unwrap",
        "validate-unknown"
      ])
    );
  });

  it("exposes meta information", () => {
    expect(plugin.meta.name).toBe("@ethang/eslint-plugin");
  });

  it("registers every rule with a non-empty schema-less meta", () => {
    for (const rule of values(rules)) {
      expect(rule.meta.docs?.description).toBeTruthy();
    }
  });
});
