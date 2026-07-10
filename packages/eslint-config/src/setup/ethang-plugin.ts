import type { Linter } from "eslint";

import { rules as ethangRulesRecord } from "@ethang/eslint-plugin";
import keys from "lodash/keys.js";
import reduce from "lodash/reduce.js";

import { Plugin } from "../build/plugin.ts";

const ruleNames = keys(ethangRulesRecord);

const ethangRules = reduce(
  ruleNames,
  (accumulator, name) => {
    accumulator[`@ethang/${name}`] = "error";
    return accumulator;
  },
  {} as Linter.RulesRecord
);

export const ethangPluginConfig = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import ethangPlugin from "@ethang/eslint-plugin";',
  name: "@ethang/eslint-plugin",
  order: 4,
  pluginName: "@ethang",
  pluginValue: "ethangPlugin",
  rules: ethangRules,
  url: "https://github.com/eglove/ethang-monorepo/tree/master/packages/eslint-plugin"
});
