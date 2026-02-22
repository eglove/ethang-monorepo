import tailwind from "eslint-plugin-tailwindcss";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(tailwind.rules));
const customRules = [
  { name: "no-custom-classname", rule: "off" },
  { name: "no-arbitrary-value", rule: "off" },
];

export const tailwindRules = genRules(ruleNames, customRules, "tailwind");
