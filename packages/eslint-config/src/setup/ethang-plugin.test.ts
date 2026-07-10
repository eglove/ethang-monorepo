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

  it("should set all rules to error", () => {
    const ruleKeys = keys(ethangPluginConfig.rules);

    expect(
      every(ruleKeys, (key) => {
        return "error" === ethangPluginConfig.rules[key];
      })
    ).toBe(true);
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
