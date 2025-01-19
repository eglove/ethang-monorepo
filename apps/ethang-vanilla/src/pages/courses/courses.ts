import map from "lodash/map.js";
import { mkdirSync, writeFileSync } from "node:fs";

import { compileTemplate } from "../../util/compile-template.js";
import { getStyles } from "../../util/get-styles.js";
import {
  academindCourseData,
  bonusCourseData,
  coltSteeleCourseData,
  frontendMastersCourseData,
  readingCourseData,
  zeroToMasteryCourseData,
} from "./data.js";

export const coursesTemplate = async () => {
  const styles = await getStyles({
    content: [
      "./src/layouts/main-layout.html",
      "./src/pages/courses/courses.html",
      "./src/pages/courses/course-list.html",
    ],
  });

  const courseListTemplates = map(
    [
      {
        content: compileTemplate({
          filePath: "./src/pages/courses/colt-steele-template.html",
        }),
        courses: coltSteeleCourseData,
        title: "Beginner: Colt Steele",
      },
      {
        content: compileTemplate({
          filePath: "./src/pages/courses/academind-template.html",
        }),
        courses: academindCourseData,
        title: "Learn to Build: Academind",
      },
      {
        content: compileTemplate({
          filePath: "./src/pages/courses/frontend-masters-template.html",
        }),
        courses: frontendMastersCourseData,
        title: "Learn the Web: Frontend Masters",
      },
      {
        content: compileTemplate({
          filePath: "./src/pages/courses/zero-to-mastery-template.html",
        }),
        courses: zeroToMasteryCourseData,
        title: "Broaden Your SkillSet: Zero to Mastery",
      },
      {
        content: compileTemplate({
          filePath: "./src/pages/courses/bonus-template.html",
        }),
        courses: bonusCourseData,
        title: "Bonus",
      },
      {
        content: compileTemplate({
          filePath: "./src/pages/courses/reading-template.html",
        }),
        courses: readingCourseData,
        title: "Reading",
      },
    ],
    (parameters) => {
      return compileTemplate({
        compileParameters: {
          ...parameters,
        },
        filePath: "./src/pages/courses/course-list.html",
      });
    },
  );

  const coursesContent = compileTemplate({
    compileParameters: {
      coltSteeleCourses: courseListTemplates.join(""),
    },
    filePath: "./src/pages/courses/courses.html",
  });

  const withLayout = compileTemplate({
    compileParameters: {
      baseUrl: "../",
      main: coursesContent,
      style: styles,
    },
    filePath: "./src/layouts/main-layout.html",
  });

  mkdirSync("./dist/courses");
  writeFileSync("./dist/courses/index.html", withLayout, { encoding: "utf8" });
};
