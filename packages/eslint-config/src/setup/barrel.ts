// @ts-expect-error no types
import barrel from "eslint-plugin-barrel-files";

import {
  type CustomRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = Object.keys(getNonDeprecatedRules(barrel.rules));
const customRules: CustomRules = [
  { name: "avoid-importing-barrel-files", rule: "off" },
];

export const barrelRules = genRules(ruleNames, customRules, "barrel");
