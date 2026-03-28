import tanstack from "@tanstack/eslint-plugin-router";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.js";

const ruleNames = keys(getNonDeprecatedRules(tanstack.rules));

export const tanstackRouterRules = genRules(ruleNames, [], "@tanstack/router");

export const tanstackRouterPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import tanstackRouter from "@tanstack/eslint-plugin-router";',
  name: "@tanstack/eslint-plugin-router",
  order: 8,
  pluginName: "@tanstack/router",
  pluginValue: "tanstackRouter",
  rules: tanstackRouterRules,
  url: "https://tanstack.com/router/latest/docs/eslint/eslint-plugin-router",
});
