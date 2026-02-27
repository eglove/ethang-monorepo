import isNil from "lodash/isNil.js";
import join from "lodash/join.js";
import kebabCase from "lodash/kebabCase.js";
import map from "lodash/map.js";
import slice from "lodash/slice.js";
import split from "lodash/split.js";

import { coursePathData } from "../../stores/course-path-store.ts";
import { ArrowUpSvg } from "../svg/arrow-up.tsx";
import { ChevronUpSvg } from "../svg/chevron-up.tsx";
import { List } from "../typography/list.tsx";
import { CourseList } from "./course-list.tsx";
import { CourseToc } from "./course-toc.tsx";

export const swebokFocusMap = new Map([
  ["architecture", "Software Architecture"],
  ["certification", "Certification"],
  ["computing", "Computing Foundations"],
  ["construction", "Software Construction"],
  ["design", "Software Design"],
  ["economics", "Software Engineering Economics"],
  ["engineering-operations", "Software Engineering Operations"],
  ["engineering", "Engineering Foundations"],
  ["maintenance", "Software Maintenance"],
  ["management", "Software Engineering Management"],
  ["mathematical", "Mathematical Foundations"],
  ["models-methods", "Software Engineering Models and Methods"],
  ["process", "Software Engineering Process"],
  ["professional-practice", "Software Engineering Professional Practice"],
  ["quality", "Software Quality"],
  ["requirements", "Software Requirements"],
  ["scm", "Software Configuration Management"],
  ["security", "Software Security"],
  ["testing", "Software Testing"],
]);

export const CoursesContainer = async () => {
  const { learningPaths } = coursePathData;

  return (
    <div class="flex flex-col gap-8">
      <CourseToc />

      <List className="max-w-none divide-y-0">
        {map(learningPaths, async (path) => {
          const names = split(path.name, ":");
          const [firstPart] = names;
          const secondPart = join(slice(names, 1), " ");
          const hasSecondPart = !isNil(secondPart) && "" !== secondPart;

          const id = kebabCase(path.name);

          return (
            <li id={id} key={path._id} class="group/section py-6">
              <div class="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 class="text-2xl tracking-tight text-gray-900 dark:text-white">
                    <span
                      className={
                        hasSecondPart
                          ? "text-gray-600 dark:text-gray-300"
                          : "text-fuchsia-600 dark:text-fuchsia-400"
                      }
                    >
                      {firstPart}
                      {hasSecondPart ? ":" : ""}
                    </span>
                    {hasSecondPart && (
                      <span className="text-fuchsia-600 dark:text-fuchsia-400">
                        {" "}
                        {secondPart}
                      </span>
                    )}
                  </h2>
                  <div class="mt-1 flex flex-wrap items-center gap-3 text-sm">
                    <span class="rounded-full bg-amber-100 px-3 py-0.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {path.courseCount} courses
                    </span>
                    <span class="text-gray-400 dark:text-gray-500">|</span>
                    <span class="rounded-full bg-emerald-100 px-3 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {swebokFocusMap.get(path.swebokFocus)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  data-scroll-top
                  class="invisible flex cursor-pointer items-center gap-1.5 text-xs text-white transition-all group-hover/section:visible hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                >
                  <ChevronUpSvg className="h-3.5 w-3.5" />
                  Top
                </button>
              </div>

              <CourseList courses={path.courses} />
            </li>
          );
        })}
      </List>

      <div class="flex justify-center pt-8">
        <button
          type="button"
          data-scroll-top
          class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 transition-all hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-800 dark:bg-white dark:text-gray-900 dark:hover:border-indigo-700 dark:hover:text-indigo-600"
        >
          <ArrowUpSvg className="h-4 w-4" />
          Back to Top
        </button>
      </div>

      <script src="/scripts/courses/courses.js" />
    </div>
  );
};
