import markdown from "@eslint/markdown";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
import {
  type CustomRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(markdown.rules));
const customRules: CustomRules = [];

export const markdownRules = genRules(ruleNames, customRules, "markdown");

export const markdownPlugin = new Plugin({
  files: "**/*.md",
  importString: 'import markdown from "@eslint/markdown";',
  name: "@eslint/markdown",
  order: 0,
  pluginName: "markdown",
  pluginValue: "markdown",
  rules: markdownRules,
  url: "https://github.com/eslint/markdown",
});
