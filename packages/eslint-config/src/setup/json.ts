import json from "@eslint/json";
import keys from "lodash/keys.js";

import {
  type CustomRules,
  type EsLintRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = keys(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  getNonDeprecatedRules(json.rules as unknown as EsLintRules),
);
const customRules: CustomRules = [];

export const jsonRules = genRules(ruleNames, customRules, "json");
