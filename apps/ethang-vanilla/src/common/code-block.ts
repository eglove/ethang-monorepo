import { compileTemplate } from "../util/compile-template.js";

type CodeBlockTemplateProperties = {
  code: string;
  languageClass?: string;
};

export const codeBlockTemplate = (
  properties: CodeBlockTemplateProperties,
) => {
  return compileTemplate({
    compileParameters: {
      code: properties.code,
      languageClass: properties.languageClass ?? "language-typescript",
    },
    filePath: "./src/common/code-block.html",
  });
};
