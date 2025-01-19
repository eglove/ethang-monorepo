import { compileTemplate } from "../util/compile-template.js";

export type MainLayoutTemplateProperties = {
  baseUrl: string;
  content: string;
  styles: string;
};

export const mainLayoutTemplate = (
  properties: MainLayoutTemplateProperties,
) => {
  return compileTemplate({
    compileParameters: {
      baseUrl: properties.baseUrl,
      main: properties.content,
      style: properties.styles,
    },
    filePath: "./src/layouts/main-layout.html",
  });
};
