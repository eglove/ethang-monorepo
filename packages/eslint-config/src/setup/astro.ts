import astro from "eslint-plugin-astro";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(astro.rules));
const customRules = [
  {
    name: "no-set-html-directive",
    rule: "off",
  },
];

export const astroRules = genRules(ruleNames, customRules, "astro");
