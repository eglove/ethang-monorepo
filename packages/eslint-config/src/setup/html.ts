import html from "@html-eslint/eslint-plugin";
import get from "lodash/get.js";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
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

export const htmlPlugin = new Plugin({
  extraRules: { "prettier/prettier": "off" },
  files: "**/*.html",
  importString: 'import html from "@html-eslint/eslint-plugin";',
  language: "html/html",
  name: "@html-eslint/eslint-plugin",
  order: 0,
  pluginName: "html",
  pluginValue: "html",
  rules: htmlRules,
  url: "https://github.com/html-eslint/html-eslint",
});
