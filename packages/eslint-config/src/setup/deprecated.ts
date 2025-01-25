// eslint-disable-next-line sonar/deprecation
import { builtinRules } from "eslint/use-at-your-own-risk";

import { type CustomRules, genRules } from "./gen-rules.ts";

const ruleNames: string[] = [];
// eslint-disable-next-line sonar/deprecation,@typescript-eslint/no-deprecated
for (const [key, rule] of builtinRules.entries()) {
  if (true === rule.meta?.deprecated) {
    ruleNames.push(key);
  }
}

const customRules: CustomRules = [];

export const deprecatedRules = genRules(
  ruleNames,
  customRules,
  undefined,
  "off",
);
