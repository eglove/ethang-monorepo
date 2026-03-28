import groupBy from "lodash/groupBy.js";
import sumBy from "lodash/sumBy.js";

import type { Plugin } from "./plugin.ts";

export type OutputConfigOptions = {
  extraConfigEntries?: string[];
  extraImports?: string[];
  fileName: string;
  functionParameters?: string;
  globalIgnores?: string[];
  includeIgnores?: boolean;
  includeLanguageOptions?: boolean;
  includeReactVersion?: boolean;
  plugins: Plugin[];
  readmeImport?: string;
  readmeLabel?: string;
};

export class OutputConfig {
  public readonly extraConfigEntries?: string[];
  public readonly extraImports?: string[];
  public readonly fileName: string;
  public readonly functionParameters?: string;
  public readonly globalIgnores?: string[];
  public readonly includeIgnores?: boolean;
  public readonly includeLanguageOptions?: boolean;
  public readonly includeReactVersion?: boolean;
  public readonly plugins: Plugin[];
  public readonly readmeImport?: string;
  public readonly readmeLabel?: string;

  public get pluginsByFiles(): Record<string, Plugin[]> {
    return groupBy(this.plugins, (plugin) => plugin.files);
  }

  public get ruleCount(): number {
    return sumBy(this.plugins, (plugin) => plugin.ruleCount);
  }

  public constructor(options: OutputConfigOptions) {
    this.extraConfigEntries = options.extraConfigEntries;
    this.extraImports = options.extraImports;
    this.fileName = options.fileName;
    this.functionParameters = options.functionParameters;
    this.globalIgnores = options.globalIgnores;
    this.includeIgnores = options.includeIgnores;
    this.includeLanguageOptions = options.includeLanguageOptions;
    this.includeReactVersion = options.includeReactVersion;
    this.plugins = options.plugins;
    this.readmeImport = options.readmeImport;
    this.readmeLabel = options.readmeLabel;
  }
}
