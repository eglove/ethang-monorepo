import vitest from "@vitest/eslint-plugin";
import keys from "lodash/keys.js";

import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

const ruleNames = keys(getNonDeprecatedRules(vitest.rules));

const customRules = [
  {
    name: "prefer-importing-vitest-globals",
    rule: "off",
  },
  {
    name: "@typescript-eslint/no-unsafe-type-assertion",
    rule: "off",
    skipPrefix: true,
  },
  {
    name: "unicorn/no-useless-undefined",
    rule: "off",
    skipPrefix: true,
  },
];

export const vitestRules = genRules(ruleNames, customRules, "vitest");
