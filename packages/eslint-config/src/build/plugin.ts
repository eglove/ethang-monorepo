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
  public readonly auxiliaryImport?: string | undefined;
  public readonly extraOptions?: string | undefined;
  public readonly extraRules?: Record<string, string> | undefined;
  public readonly files: string;
  public readonly importString?: string | undefined;
  public readonly includeAngularLanguageOptions?: boolean | undefined;
  public readonly language?: string | undefined;
  public readonly name: string;
  public readonly order?: number | undefined;
  public readonly pluginName?: string | undefined;
  public readonly pluginValue?: string | undefined;
  public readonly processor?: string | undefined;
  public readonly rules: Linter.RulesRecord;
  public readonly url: string;

  public get ruleCount(): number {
    return filter(values(this.rules), (value) => {
      const severity = isArray(value) ? value[0] : value;
      return "off" !== severity && 0 !== severity;
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
