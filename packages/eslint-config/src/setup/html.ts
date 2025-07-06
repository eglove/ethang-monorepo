import html from "@html-eslint/eslint-plugin";
import get from "lodash/get.js";
import keys from "lodash/keys.js";

import { genRules } from "./gen-rules.ts";

const ruleNames = keys(get(html, ["rules"], []));

const customRules = [
  { name: "indent", rule: "off" },
  { name: "no-extra-spacing-attrs", rule: "off" },
  { name: "attrs-newline", rule: "off" },
  { name: "require-closing-tags", rule: "off" },
  { name: "element-newline", rule: "off" },
];

export const htmlRules = genRules(ruleNames, customRules, "html");
