import react from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import keys from "lodash/keys.js";

import {
  type EsLintRules,
  genRules,
  getNonDeprecatedRules,
} from "./gen-rules.ts";

const reactRuleNames = keys(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  getNonDeprecatedRules(react.rules as unknown as EsLintRules),
);
const reactGen = genRules(reactRuleNames, [], "react");

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const reactHookRuleNames = keys(reactHooks.rules as unknown as EsLintRules);
const customHookRules = [
  {
    name: "exhaustive-deps",
    rule: "error",
  },
  {
    name: "rules-of-hooks",
    rule: "error",
  },
];
const hookGen = genRules(reactHookRuleNames, customHookRules, "react-hooks");

export const reactRules = {
  ...reactGen,
};

export const reactHookRules = {
  ...hookGen,
};
