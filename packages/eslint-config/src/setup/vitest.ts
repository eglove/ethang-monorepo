import vitest from "@vitest/eslint-plugin";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(vitest.rules));

const customRules = [
  {
    name: "prefer-importing-vitest-globals",
    rule: "off",
  },
  {
    name: "no-importing-vitest-globals",
    rule: "off",
  },
  {
    name: "require-test-timeout",
    rule: "off",
  },
  {
    name: "prefer-expect-assertions",
    rule: "off",
  },
  {
    name: "valid-title",
    rule: "off",
  },
  {
    name: "prefer-to-be-truthy",
    rule: "off",
  },
  {
    name: "prefer-to-be-falsy",
    rule: "off",
  },
  {
    name: "require-mock-type-parameters",
    rule: "off",
  },
  {
    name: "prefer-called-once",
    rule: "off",
  },
  {
    name: "@typescript-eslint/no-unsafe-type-assertion",
    rule: "off",
    skipPrefix: true,
  },
  {
    name: "unicorn/no-useless-undefined",
    rule: "off",
    skipPrefix: true,
  },
];

export const vitestRules = genRules(ruleNames, customRules, "vitest");

export const vitestPlugin = new Plugin({
  files: "**/*.test.{ts,tsx,js,jsx,mjs,cjs}",
  importString: 'import vitest from "@vitest/eslint-plugin";',
  name: "@vitest/eslint-plugin",
  order: 0,
  pluginName: "vitest",
  pluginValue: "vitest",
  rules: vitestRules,
  url: "https://github.com/vitest-dev/eslint-plugin-vitest",
});
