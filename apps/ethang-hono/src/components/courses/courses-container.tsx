import isNil from "lodash/isNil.js";
import join from "lodash/join.js";
import map from "lodash/map.js";
import slice from "lodash/slice.js";
import split from "lodash/split.js";

import { coursePathData } from "../../stores/course-path-store.ts";
import { CourseList } from "./course-list.tsx";

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
    <div class="[counter-reset:course-list]">
      <ul class="list-inside list-disc space-y-4 text-body">
        {map(learningPaths, async (path) => {
          const names = split(path.name, ":");
          const [firstPart] = names;
          const secondPart = join(slice(names, 1), " ");
          const hasSecondPart = !isNil(secondPart) && "" !== secondPart;

          return (
            <li>
              <span>
                <a
                  href={path.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="underline underline-offset-2"
                >
                  <span
                    class={
                      hasSecondPart
                        ? "text-fg-purple"
                        : "text-fg-warning-subtle"
                    }
                  >
                    {firstPart}
                  </span>
                  {hasSecondPart ? ":" : ""}
                  {hasSecondPart && (
                    <span class="text-fg-warning-subtle">{secondPart}</span>
                  )}
                </a>{" "}
                |{" "}
                <span class="text-fg-brand-subtle">
                  {swebokFocusMap.get(path.swebokFocus)}
                </span>
              </span>

              <CourseList courses={path.courses} />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
