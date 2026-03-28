import json from "@eslint/json";
import keys from "lodash/keys.js";

import { Plugin } from "../build/plugin.ts";
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

const eslintJson = "@eslint/json";
const eslintJsonUrl = "https://github.com/eslint/json";
const jsonImportString = 'import json from "@eslint/json";';

export const jsonPlugin = new Plugin({
  files: "**/*.json",
  importString: jsonImportString,
  language: "json/json",
  name: eslintJson,
  order: 0,
  pluginName: "json",
  pluginValue: "json",
  rules: jsonRules,
  url: eslintJsonUrl,
});

export const jsoncPlugin = new Plugin({
  files: "**/*.jsonc",
  importString: jsonImportString,
  language: "json/jsonc",
  name: eslintJson,
  order: 0,
  pluginName: "json",
  pluginValue: "json",
  rules: jsonRules,
  url: eslintJsonUrl,
});

export const json5Plugin = new Plugin({
  files: "**/*.json5",
  importString: jsonImportString,
  language: "json/json5",
  name: eslintJson,
  order: 0,
  pluginName: "json",
  pluginValue: "json",
  rules: jsonRules,
  url: eslintJsonUrl,
});
