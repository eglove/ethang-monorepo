import compat from "eslint-plugin-compat";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import {
  type CustomRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(compat.rules));
const changedRules: CustomRules = [];

export const compatRules = genRules(ruleNames, changedRules, "compat");

export const compatPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import compat from "eslint-plugin-compat";',
  name: "eslint-plugin-compat",
  order: 0,
  pluginName: "compat",
  pluginValue: "compat",
  rules: compatRules,
  url: "https://github.com/amilajack/eslint-plugin-compat",
});
