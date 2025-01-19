import { compileTemplate } from "../util/compile-template.js";

export type MainLayoutTemplateProperties = {
  baseUrl: string;
  content: string;
  styles: string;
  title: string;
};

export const mainLayoutTemplate = (
  properties: MainLayoutTemplateProperties,
) => {
  return compileTemplate({
    compileParameters: {
      baseUrl: properties.baseUrl,
      main: properties.content,
      style: properties.styles,
      title: properties.title,
    },
    filePath: "./src/layouts/main-layout.html",
  });
};
