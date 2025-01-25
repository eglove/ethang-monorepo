import react from "@eslint-react/eslint-plugin";
// @ts-expect-error no types
import compiler from "eslint-plugin-react-compiler";
// @ts-expect-error no types
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
    name: "debug/react-hooks",
    rule: "off",
  },
  {
    name: "naming-convention/filename",
    rule: ["error", { rule: "kebab-case" }],
  },
];
const reactGen = genRules(reactRuleNames, customReactRules, "react");

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-unsafe-member-access
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

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const reactCompilerRuleNames = keys(compiler.rules);
const compilerGen = genRules(reactCompilerRuleNames, [], "react-compiler");

export const reactRules = {
  ...reactGen,
};

export const reactHookRules = {
  ...hookGen,
};

export const reactCompilerRules = {
  ...compilerGen,
};
