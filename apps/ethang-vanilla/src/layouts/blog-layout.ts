import { compileTemplate } from "../util/compile-template.js";
import {
  mainLayoutTemplate,
  type MainLayoutTemplateProperties,
} from "./main-layout.js";

type BlogLayoutTemplateProperties = MainLayoutTemplateProperties;

export const blogLayoutStyleDependencies = [
  "./src/layouts/main-layout.html",
  "./src/layouts/blog-layout.html",
];

export const blogLayoutTemplate = (
  properties: BlogLayoutTemplateProperties,
) => {
  const blogTemplate = compileTemplate({
    compileParameters: {
      content: properties.content,
    },
    filePath: "./src/layouts/blog-layout.html",
  });

  return mainLayoutTemplate({
    baseUrl: properties.baseUrl,
    content: blogTemplate,
    styles: properties.styles,
    title: properties.title,
  });
};
