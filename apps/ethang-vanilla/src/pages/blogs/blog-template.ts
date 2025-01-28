import { mkdirSync, writeFileSync } from "node:fs";

import { mainLayoutTemplate } from "../../layouts/main-layout.js";
import { nightOwlStyles } from "../../util/code-highlight.js";
import {
  compileTemplate,
  type CompileTemplateProperties,
} from "../../util/compile-template.js";
import { getStyles } from "../../util/get-styles.js";
import { noMisusedSpreadCodeExamples } from "./looking-at-no-misused-spread/looking-at-no-misused-spread.js";

type BlogTemplateProperties = {
  additionalStyles?: string[];
  compileParameters?: CompileTemplateProperties["compileParameters"];
  fileSlug: string;
  title: string;
};

export const blogs: BlogTemplateProperties[] = [
  {
    fileSlug: "angular-now",
    title: "It's Angular Now",
  },
  {
    fileSlug: "forcing-react",
    title: "Forcing React to be What It Isn't",
  },
  {
    fileSlug: "motivation",
    title: "Notes on Motivation",
  },
  {
    additionalStyles: [nightOwlStyles],
    compileParameters: {
      ...noMisusedSpreadCodeExamples,
    },
    fileSlug: "looking-at-no-misused-spread",
    title: "Looking At: no-misused-spread",
  },
  {
    fileSlug: "mimetic-desire",
    title: "Mimetic Desire",
  },
  {
    fileSlug: "javascript-standard-library",
    title: "JavaScript Standard Library",
  },
  {
    fileSlug: "extract",
    title: "Extract",
  },
];

export const blogTemplate = async (properties: BlogTemplateProperties) => {
  const styles = await getStyles();

  // @ts-expect-error dunno
  const contentTemplate = compileTemplate({
    compileParameters: properties.compileParameters,
    filePath: `./src/pages/blogs/${properties.fileSlug}/${properties.fileSlug}.html`,
  });

  const template = mainLayoutTemplate({
    baseUrl: "../../",
    content: contentTemplate,
    styles: `${styles} ${properties.additionalStyles?.join("") ?? ""}`,
    title: properties.title,
  });

  mkdirSync(`./dist/blog/${properties.fileSlug}`, { recursive: true });

  writeFileSync(`./dist/blog/${properties.fileSlug}/index.html`, template, {
    encoding: "utf8",
  });
};
