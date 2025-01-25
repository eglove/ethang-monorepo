import markdown from "@eslint/markdown";
import isNil from "lodash/isNil.js";
import keys from "lodash/keys.js";

import {
  type CustomRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = keys(
  getNonDeprecatedRules(isNil(markdown.rules) ? {} : markdown.rules),
);
const customRules: CustomRules = [];

export const markdownRules = genRules(ruleNames, customRules, "markdown");
