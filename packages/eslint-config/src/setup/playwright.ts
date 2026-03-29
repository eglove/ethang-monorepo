import playwright from "eslint-plugin-playwright";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(playwright.rules));

const customRules = [
  { name: "require-tags", rule: "off" },
  { name: "no-nth-methods", rule: "off" },
  { name: "no-hooks", rule: "off" },
];

export const playwrightRules = genRules(ruleNames, customRules, "playwright");

export const playwrightPlugin = new Plugin({
  files: "**/*.spec.ts",
  importString: 'import playwright from "eslint-plugin-playwright";',
  name: "eslint-plugin-playwright",
  pluginName: "playwright",
  pluginValue: "playwright",
  rules: playwrightRules,
  url: "https://github.com/mskelton/eslint-plugin-playwright",
});
