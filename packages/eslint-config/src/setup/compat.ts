import compat from "eslint-plugin-compat";
import keys from "lodash/keys.js";

import {
  type CustomRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(compat.rules));
const changedRules: CustomRules = [];

export const compatRules = genRules(ruleNames, changedRules, "compat");
