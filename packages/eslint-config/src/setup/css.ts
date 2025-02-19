import css from "@eslint/css";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.js";

const ruleNames = keys(getNonDeprecatedRules(css.rules));

export const cssRules = genRules(
  ruleNames,
  [{ name: "no-invalid-at-rules", rule: "off" }],
  "css",
);
