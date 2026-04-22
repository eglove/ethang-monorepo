import solid from "eslint-plugin-solid";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(solid.rules));
const customRules = [
  {
    name: "no-proxy-apis",
    rule: "off",
  },
];

export const solidRules = genRules(ruleNames, customRules, "solid");

export const solidPlugin = new Plugin({
  files: "**/*.{jsx,tsx}",
  importString: 'import solid from "eslint-plugin-solid";',
  name: "eslint-plugin-solid",
  pluginName: "solid",
  pluginValue: "solid",
  rules: solidRules,
  url: "https://github.com/solidjs-community/eslint-plugin-solid",
});
