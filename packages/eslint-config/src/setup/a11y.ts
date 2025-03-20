import a11y from "eslint-plugin-jsx-a11y";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

// @ts-expect-error its ok
const ruleNames = keys(getNonDeprecatedRules(a11y.rules ?? {}));
const customRules = [
  {
    // throws false positives
    name: "control-has-associated-label",
    rule: "off",
  },
  {
    name: "media-has-caption",
    rule: "off",
  },
];

export const a11yRules = genRules(ruleNames, customRules, "a11y");
