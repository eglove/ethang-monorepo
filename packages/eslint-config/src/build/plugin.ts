import type { Linter } from "eslint";

import filter from "lodash/filter.js";
import isArray from "lodash/isArray.js";
import values from "lodash/values.js";

export type PluginOptions = {
  auxiliaryImport?: string;
  extraOptions?: string;
  extraRules?: Record<string, string>;
  files: string;
  importString?: string;
  includeAngularLanguageOptions?: boolean;
  language?: string;
  name: string;
  order?: number;
  pluginName?: string;
  pluginValue?: string;
  processor?: string;
  rules: Linter.RulesRecord;
  url: string;
};

export class Plugin {
  public readonly auxiliaryImport?: string;
  public readonly extraOptions?: string;
  public readonly extraRules?: Record<string, string>;
  public readonly files: string;
  public readonly importString?: string;
  public readonly includeAngularLanguageOptions?: boolean;
  public readonly language?: string;
  public readonly name: string;
  public readonly order?: number;
  public readonly pluginName?: string;
  public readonly pluginValue?: string;
  public readonly processor?: string;
  public readonly rules: Linter.RulesRecord;
  public readonly url: string;

  public get ruleCount(): number {
    return filter(values(this.rules), (value) => {
      const severity = isArray(value) ? value[0] : value;
      return "off" !== severity;
    }).length;
  }

  public constructor(options: PluginOptions) {
    this.auxiliaryImport = options.auxiliaryImport;
    this.extraOptions = options.extraOptions;
    this.extraRules = options.extraRules;
    this.files = options.files;
    this.importString = options.importString;
    this.includeAngularLanguageOptions = options.includeAngularLanguageOptions;
    this.language = options.language;
    this.name = options.name;
    this.order = options.order;
    this.pluginName = options.pluginName;
    this.pluginValue = options.pluginValue;
    this.processor = options.processor;
    this.rules = options.rules;
    this.url = options.url;
  }
}
