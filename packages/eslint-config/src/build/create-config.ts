import flow from "lodash/flow.js";
import isNil from "lodash/isNil.js";
import keys from "lodash/keys.js";
import map from "lodash/map.js";

import { getLatestReact } from "./get-react-version.ts";
import {
  getList,
  getListJson,
  getListPlugins,
  getTypeFiles,
  getTypeLanguage,
} from "./list-utilities.ts";

export type ConfigOptions = {
  extraImports?: string[];
  extraOptions?: string;
  extraRules?: Record<string, string>;
  globalIgnores?: string[];
  includeAngularLanguageOptions?: boolean;
  includeIgnores?: boolean;
  includeLanguageOptions?: boolean;
  includeReactVersion?: boolean;
  processor?: string;
};

const getIgnoresString = flow(
  (globalIgnores: string[] | undefined) => {
    return map(globalIgnores, (ignore) => {
      return `"${ignore}"`;
    });
  },
  (list) => list.join(", "),
);

export const createConfig = async (
  type: string,
  options: ConfigOptions = {},
): Promise<string[]> => {
  const configs: string[] = [];
  let settings;

  if (!isNil(options.includeReactVersion)) {
    const react = await getLatestReact();
    settings = JSON.stringify({
      react: { version: react?.version },
    }).slice(1, -1);
  }

  const list = getList(type);
  const ruleJson = getListJson(list);
  const extraRules = options.extraRules ?? {};
  const hasExtraRules = 0 < keys(extraRules).length;
  const offRulesJson = hasExtraRules
    ? `,${JSON.stringify(extraRules).slice(1, -1)}`
    : "";

  let optionals = "";

  if (!isNil(options.includeIgnores)) {
    optionals += "\nignores,";
  }

  if (
    !isNil(options.includeLanguageOptions) &&
    isNil(options.includeAngularLanguageOptions)
  ) {
    optionals += "\nlanguageOptions,";
  }

  if (!isNil(options.includeAngularLanguageOptions)) {
    optionals += "\nlanguageOptions: angularLanguageOptions,";
  }

  if (!isNil(options.processor)) {
    optionals += `\nprocessor: ${options.processor},`;
  }

  if (!isNil(options.includeReactVersion) && !isNil(settings)) {
    optionals += `\nsettings: {
  ${settings}
},`;
  }

  const language = getTypeLanguage(type);

  if (options.globalIgnores) {
    configs.push(`{
      ignores: [${getIgnoresString(options.globalIgnores)}],
    }`);
  }

  configs.push(`{
    files: ["${getTypeFiles(type)}"],${optionals}${language ? `language: "${language}",` : ""}
    plugins: {
      ${getListPlugins(list)}
    },
    rules: {
      ${ruleJson}${offRulesJson}
    },
    ${isNil(options.extraOptions) ? "" : options.extraOptions}
  }`);

  return configs;
};
