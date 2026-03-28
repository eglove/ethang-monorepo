import react from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
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

export const reactPlugin = new Plugin({
  files: "**/*.{jsx,tsx}",
  importString: 'import react from "@eslint-react/eslint-plugin";',
  name: "@eslint-react/eslint-plugin",
  pluginName: "react",
  pluginValue: "react",
  rules: reactRules,
  url: "https://eslint-react.xyz/",
});

export const reactHooksPlugin = new Plugin({
  files: "**/*.{jsx,tsx}",
  importString: 'import reactHooks from "eslint-plugin-react-hooks";',
  name: "eslint-plugin-react-hooks",
  pluginName: "react-hooks",
  pluginValue: "reactHooks",
  rules: reactHookRules,
  url: "https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks",
});
