import { getLatestReact } from "./get-react-version.ts";
import {
  getList,
  getListJson,
  getListPlugins,
  getTypeFiles,
  getTypeLanguage,
} from "./list-utils.ts";

export type ConfigOptions = {
  extraImports?: string[];
  includeIgnores?: boolean;
  includeLanguageOptions?: boolean;
  includeAngularLanguageOptions?: boolean;
  includeReactVersion?: boolean;
  globalIgnores?: string[];
  processor?: string;
};

export const createConfig = async (
  type: string,
  options: ConfigOptions = {},
) => {
  let config = "";
  let settings;

  if (options.includeReactVersion) {
    const react = await getLatestReact();
    settings = JSON.stringify({
      react: { version: react.version },
    }).slice(1, -1);
  }

  const list = getList(type);
  const ruleJson = getListJson(list);

  let optionals = "";

  if (options.includeIgnores) {
    optionals += "\nignores,";
  }

  if (options.includeLanguageOptions) {
    optionals += "\nlanguageOptions,";
  }

  if (options.includeAngularLanguageOptions) {
    optionals += "\nlanguageOptions: angularLanguageOptions,";
  }

  if (options.processor) {
    optionals += `\nprocessor: ${options.processor},`;
  }

  if (options.includeReactVersion && settings) {
    optionals += `\nsettings: {
  ${settings}
},`;
  }

  const language = getTypeLanguage(type);

  if (options.globalIgnores) {
    config += `{
      ignores: [${options.globalIgnores
        .map((ignore) => {
          return `"${ignore}"`;
        })
        .join(", ")}],
    },`;
  }

  config += `{
    files: ["${getTypeFiles(type)}"],${optionals}${language ? `language: "${language}",` : ""}
    plugins: {
      ${getListPlugins(list)}
    },
    rules: {
      ${ruleJson}
    },
  },`;

  return config;
};
