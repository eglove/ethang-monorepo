import { MarkdownGenerator } from "@ethang/markdown-generator/markdown-generator.js";
import forEach from "lodash/forEach.js";
import kebabCase from "lodash/kebabCase.js";
import toLower from "lodash/toLower.js";

import { coursePathData } from "../../stores/course-path-store.ts";

export const coursesText = () => {
  const md = new MarkdownGenerator();
  md.header(1, "EthanG | Recommended Courses", 1);
  md.header(
    2,
    "A structured, self-directed curriculum covering full-stack development, architecture, and DevOps.",
    2,
  );
  md.header(3, "Curriculum Overview", 2);

  md.tableHeader(["Path", "Name", "Author", "Link"]);
  forEach(coursePathData.learningPaths, (learningPath) => {
    forEach(learningPath.courses, (course) => {
      md.tableRow([
        learningPath.name,
        course.name,
        course.author,
        `[View Course](${course.url})`,
      ]);
    });
  });
  md.newLine();

  forEach(coursePathData.learningPaths, (learningPath, index) => {
    md.header(3, learningPath.name, 2);
    md.bold(`Provider: [${learningPath.name}](${learningPath.url})`, 1);
    md.text(`${index + 1}. ${learningPath.name}\n`);
    forEach(learningPath.courses, (course) => {
      md.text(`  - **Author:** ${course.author}\n`);
      md.text(`  - **Resource:** [Direct Link](${course.url})\n`);
      md.text(
        `  - **Semantic ID:** ethang:course:${kebabCase(toLower(course.author))}:${kebabCase(toLower(course.name))}\n`,
      );
    });
  });

  return md.render();
};
