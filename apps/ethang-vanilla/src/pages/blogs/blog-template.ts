import { mkdirSync, writeFileSync } from "node:fs";

import {
  blogLayoutStyleDependencies,
  blogLayoutTemplate,
} from "../../layouts/blog-layout.js";
import { nightOwlStyles } from "../../util/code-highlight.js";
import {
  compileTemplate,
  type CompileTemplateProperties,
} from "../../util/compile-template.js";
import { getStyles } from "../../util/get-styles.js";
import {
  noMisusedSpreadCodeExamples,
} from "./looking-at-no-misused-spread/looking-at-no-misused-spread.js";

type BlogTemplateProperties = {
  additionalStyles?: string[];
  compileParameters?: CompileTemplateProperties["compileParameters"];
  fileSlug: string;
};

export const blogs: BlogTemplateProperties[] = [
  { fileSlug: "angular-now" },
  { fileSlug: "forcing-react" },
  { fileSlug: "motivation" },
  {
    additionalStyles: [nightOwlStyles],
    compileParameters: {
      ...noMisusedSpreadCodeExamples,
    },
    fileSlug: "looking-at-no-misused-spread",
  },
  { fileSlug: "mimetic-desire" },
];

export const blogTemplate = async (
  properties: BlogTemplateProperties,
) => {
  const styles = await getStyles({
    content: [
      ...blogLayoutStyleDependencies,
      `./pages/blogs/${properties.fileSlug}/${properties.fileSlug}.html`,
    ],
  });

  const template = blogLayoutTemplate({
    baseUrl: "../../",
    content: compileTemplate({
      compileParameters: properties.compileParameters,
      filePath: `./src/pages/blogs/${properties.fileSlug}/${properties.fileSlug}.html`,
    }),
    styles: `${styles} ${properties.additionalStyles?.join("") ?? ""}`,
  });

  mkdirSync(`./dist/blog/${properties.fileSlug}`, { recursive: true });
  writeFileSync(`./dist/blog/${properties.fileSlug}/index.html`, template, { encoding: "utf8" });
};
