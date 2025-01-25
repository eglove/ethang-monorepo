import solid from "eslint-plugin-solid";
import keys from "lodash/keys.js";

import {
  type EsLintRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const ruleNames = keys(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  getNonDeprecatedRules(solid.rules as unknown as EsLintRules),
);
const customRules = [
  {
    name: "no-proxy-apis",
    rule: "off",
  },
];

export const solidRules = genRules(ruleNames, customRules, "solid");
