import react from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
// @ts-expect-error no types
import reactEffect from "eslint-plugin-react-you-might-not-need-an-effect";
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
const customReactRules = [
  {
    name: "avoid-shorthand-boolean",
    rule: "off",
  },
  {
    name: "avoid-shorthand-fragment",
    rule: "off",
  },
  {
    name: "debug/class-component",
    rule: "off",
  },
  {
    name: "debug/function-component",
    rule: "off",
  },
  {
    name: "debug/hook",
    rule: "off",
  },
  {
    name: "debug/is-from-react",
    rule: "off",
  },
  {
    name: "debug/jsx",
    rule: "off",
  },
  {
    name: "debug/react-hooks",
    rule: "off",
  },
  {
    name: "naming-convention/filename",
    rule: ["error", { rule: "kebab-case" }],
  },
];
const reactGen = genRules(reactRuleNames, customReactRules, "react");

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

const effectGen = genRules(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  keys(reactEffect.rules),
  [],
  "react-you-might-not-need-an-effect",
);

export const reactRules = {
  ...reactGen,
};

export const reactHookRules = {
  ...hookGen,
};

export const effectRules = {
  ...effectGen,
};
