import depend from "eslint-plugin-depend";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(depend.rules));
const changedRules = [
  {
    name: "ban-dependencies",
    rule: ["error", { allowed: ["lodash", "fs-extra"] }],
  },
];

export const dependRules = genRules(ruleNames, changedRules, "depend");
