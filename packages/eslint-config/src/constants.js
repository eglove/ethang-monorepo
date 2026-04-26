import angularTemplateParser from "@angular-eslint/template-parser";
import { parser } from "typescript-eslint";

export const ignores = ["config.main.js", "node_modules", "dist"];

export const languageOptions = {
  parser,
  parserOptions: {
    project: true,
    tsconfigRootDir: import.meta.dirname,
  },
};

export const angularLanguageOptions = {
  parser: angularTemplateParser,
};
