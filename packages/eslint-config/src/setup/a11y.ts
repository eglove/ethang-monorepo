import a11y from "eslint-plugin-jsx-a11y";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(a11y.rules));
const customRules = [
  {
    // throws false positives
    name: "control-has-associated-label",
    rule: "off",
  },
  {
    name: "media-has-caption",
    rule: "off",
  },
];

export const a11yRules = genRules(ruleNames, customRules, "a11y");

export const a11yPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import a11y from "eslint-plugin-jsx-a11y";',
  name: "jsx-a11y",
  order: 9,
  pluginName: "a11y",
  pluginValue: "a11y",
  rules: a11yRules,
  url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y",
});
