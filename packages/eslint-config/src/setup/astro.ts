import astro from "eslint-plugin-astro";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(astro.rules));
const customRules = [
  {
    name: "no-set-html-directive",
    rule: "off",
  },
];

export const astroRules = genRules(ruleNames, customRules, "astro");

export const astroPlugin = new Plugin({
  files: "**/*.{astro}",
  importString: 'import astro from "eslint-plugin-astro";',
  name: "eslint-plugin-astro",
  pluginName: "astro",
  pluginValue: "astro",
  rules: astroRules,
  url: "https://github.com/ota-meshi/eslint-plugin-astro",
});
