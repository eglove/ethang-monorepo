import tanstack from "@tanstack/eslint-plugin-query";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(tanstack.rules));

export const tanstackQueryRules = genRules(ruleNames, [], "@tanstack/query");

export const tanstackQueryPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import tanstackQuery from "@tanstack/eslint-plugin-query";',
  name: "@tanstack/eslint-plugin-query",
  order: 7,
  pluginName: "@tanstack/query",
  pluginValue: "tanstackQuery",
  rules: tanstackQueryRules,
  url: "https://tanstack.com/query/latest/docs/eslint/eslint-plugin-query",
});
