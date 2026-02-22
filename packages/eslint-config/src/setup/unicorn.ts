import unicorn from "eslint-plugin-unicorn";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(unicorn.rules));
const customRules = [
  {
    name: "empty-brace-spaces",
    rule: "off",
  },
  {
    name: "explicit-length-check",
    rule: "off",
  },
  {
    name: "no-keyword-prefix",
    rule: "off",
  },
  {
    name: "no-nested-ternary",
    rule: "off",
  },
  {
    name: "no-null",
    rule: "off",
  },
  {
    name: "number-literal-case",
    rule: "off",
  },
  {
    name: "template-indent",
    rule: "off",
  },
];

export const unicornRules = genRules(ruleNames, customRules, "unicorn");
