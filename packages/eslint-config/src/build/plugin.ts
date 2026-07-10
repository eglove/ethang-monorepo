import type { Linter } from "eslint";

import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import values from "lodash/values.js";

export type PluginOptions = {
  auxiliaryImport?: null | string;
  extraOptions?: null | string;
  extraRules?: null | Record<string, string>;
  files: string;
  importString?: null | string;
  includeAngularLanguageOptions?: boolean | null;
  language?: null | string;
  name: string;
  order?: null | number;
  pluginName?: null | string;
  pluginValue?: null | string;
  processor?: null | string;
  rules: Linter.RulesRecord;
  url: string;
};

export class Plugin {
  public readonly auxiliaryImport: null | string;
  public readonly extraOptions: null | string;
  public readonly extraRules: null | Record<string, string>;
  public readonly files: string;
  public readonly importString: null | string;
  public readonly includeAngularLanguageOptions: boolean | null;
  public readonly language: null | string;
  public readonly name: string;
  public readonly order: null | number;
  public readonly pluginName: null | string;
  public readonly pluginValue: null | string;
  public readonly processor: null | string;
  public readonly rules: Linter.RulesRecord;
  public readonly url: string;

  public get ruleCount() {
    return filter(values(this.rules), (value) => {
      return !includes(["off", 0], isArray(value) ? value[0] : value);
    }).length;
  }

  public constructor(options: PluginOptions) {
    const {
      auxiliaryImport = null,
      extraOptions = null,
      extraRules = null,
      importString = null,
      includeAngularLanguageOptions = null,
      language = null,
      order = null,
      pluginName = null,
      pluginValue = null,
      processor = null
    } = options;

    this.auxiliaryImport = auxiliaryImport;
    this.extraOptions = extraOptions;
    this.extraRules = extraRules;
    this.files = options.files;
    this.importString = importString;
    this.includeAngularLanguageOptions = includeAngularLanguageOptions;
    this.language = language;
    this.name = options.name;
    this.order = order;
    this.pluginName = pluginName;
    this.pluginValue = pluginValue;
    this.processor = processor;
    this.rules = options.rules;
    this.url = options.url;
  }
}
