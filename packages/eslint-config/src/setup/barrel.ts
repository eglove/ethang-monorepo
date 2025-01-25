// @ts-expect-error no types
import barrel from "eslint-plugin-barrel-files";
import keys from "lodash/keys.js";

import {
  type CustomRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
const ruleNames = keys(getNonDeprecatedRules(barrel.rules));
const customRules: CustomRules = [
  { name: "avoid-importing-barrel-files", rule: "off" },
];

export const barrelRules = genRules(ruleNames, customRules, "barrel");
