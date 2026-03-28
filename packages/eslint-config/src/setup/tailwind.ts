import tailwind from "eslint-plugin-tailwindcss";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(tailwind.rules));
const customRules = [
  { name: "no-custom-classname", rule: "off" },
  { name: "no-arbitrary-value", rule: "off" },
];

export const tailwindRules = genRules(ruleNames, customRules, "tailwind");

export const tailwindPlugin = new Plugin({
  extraOptions: "settings: { tailwindcss: { config: pathToConfig } },",
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString:
    'import { fixupPluginRules } from "@eslint/compat";\nimport tailwind from "eslint-plugin-tailwindcss";',
  name: "eslint-plugin-tailwindcss",
  order: 0,
  pluginName: "tailwind",
  pluginValue: "fixupPluginRules(tailwind)",
  rules: tailwindRules,
  url: "https://github.com/francoismassart/eslint-plugin-tailwindcss",
});
