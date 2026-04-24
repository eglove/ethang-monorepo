import vitest from "@vitest/eslint-plugin";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import {
  createOffRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(vitest.rules));

const customRules = [
  ...createOffRules([
    "prefer-importing-vitest-globals",
    "no-importing-vitest-globals",
    "require-test-timeout",
    "prefer-expect-assertions",
    "valid-title",
    "prefer-to-be-truthy",
    "prefer-to-be-falsy",
    "require-mock-type-parameters",
    "prefer-called-once",
  ]),
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
