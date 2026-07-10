import every from "lodash/every.js";
import keys from "lodash/keys.js";
import startsWith from "lodash/startsWith.js";
import { describe, expect, it } from "vitest";

import { ethangPluginConfig } from "./ethang-plugin.ts";

describe("ethang-plugin setup", () => {
  it("should generate rules for @ethang/eslint-plugin", () => {
    expect(ethangPluginConfig.rules).toBeDefined();
    expect(keys(ethangPluginConfig.rules).length).toBeGreaterThan(0);
  });

  it("should set all rules to error level", () => {
    const ruleKeys = keys(ethangPluginConfig.rules);

    expect(
      every(ruleKeys, (key) => {
        const value = ethangPluginConfig.rules[key];
        const severity = Array.isArray(value) ? value[0] : value;
        return "error" === severity;
      })
    ).toBe(true);
  });

  it("should apply custom configurations for specific rules", () => {
    expect(ethangPluginConfig.rules["@ethang/chain-style"]).toStrictEqual([
      "error",
      "as-needed"
    ]);
    expect(
      ethangPluginConfig.rules["@ethang/consistent-compose"]
    ).toStrictEqual(["error", "flow"]);
    expect(
      ethangPluginConfig.rules["@ethang/identity-shorthand"]
    ).toStrictEqual(["error", "always"]);
    expect(ethangPluginConfig.rules["@ethang/import-scope"]).toStrictEqual([
      "error",
      "method"
    ]);
    expect(
      ethangPluginConfig.rules["@ethang/matches-property-shorthand"]
    ).toStrictEqual(["error", "always"]);
  });

  it("should apply custom configurations for remaining rules", () => {
    expect(ethangPluginConfig.rules["@ethang/matches-shorthand"]).toStrictEqual(
      ["error", "always", 3]
    );
    expect(ethangPluginConfig.rules["@ethang/path-style"]).toStrictEqual([
      "error",
      "array"
    ]);
    expect(
      ethangPluginConfig.rules["@ethang/property-shorthand"]
    ).toStrictEqual(["error", "always"]);
  });

  it("should prefix rules with @ethang/", () => {
    const ruleKeys = keys(ethangPluginConfig.rules);

    expect(
      every(ruleKeys, (key) => {
        return startsWith(key, "@ethang/");
      })
    ).toBe(true);
  });

  it("should configure plugin metadata", () => {
    expect(ethangPluginConfig.name).toBe("@ethang/eslint-plugin");
    expect(ethangPluginConfig.pluginName).toBe("@ethang");
    expect(ethangPluginConfig.pluginValue).toBe("ethangPlugin");
    expect(ethangPluginConfig.files).toBe(
      "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}"
    );
  });
});
