import every from "lodash/every.js";
import keys from "lodash/keys.js";
import startsWith from "lodash/startsWith.js";
import { describe, expect, it } from "vitest";

import { lodashRules } from "./lodash.ts";

describe("lodash setup", () => {
  it("should generate rules for lodash", () => {
    expect(lodashRules).toBeDefined();
    expect(keys(lodashRules).length).toBeGreaterThan(0);
  });

  it("should include custom rules with correct configuration", () => {
    expect(lodashRules["lodash/chain-style"]).toEqual([2, "as-needed"]);
    expect(lodashRules["lodash/consistent-compose"]).toEqual([2, "flow"]);
    expect(lodashRules["lodash/identity-shorthand"]).toEqual([2, "always"]);
    expect(lodashRules["lodash/import-scope"]).toEqual([2, "method"]);
  });

  it("should prefix rules with lodash/", () => {
    const ruleKeys = keys(lodashRules);
    expect(every(ruleKeys, (key) => startsWith(key, "lodash/"))).toBe(true);
  });
});
