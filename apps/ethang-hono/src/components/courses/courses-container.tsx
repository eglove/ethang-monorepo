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

class Counter {
  private count = 0;

  public getCount() {
    this.count += 1;
    return this.count;
  }
}

export const CoursesContainer = async () => {
  const { learningPaths } = coursePathData;

  const counter = new Counter();

  return (
    <ul class="list-inside list-disc space-y-4 text-slate-200">
      {map(learningPaths, async (path) => {
        const names = split(path.name, ":");
        const [firstPart] = names;
        const secondPart = join(slice(names, 1), " ");
        const hasSecondPart = !isNil(secondPart) && "" !== secondPart;

        return (
          <li>
            <span>
              {!isNil(path.url) && (
                <a
                  href={path.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="underline underline-offset-2"
                >
                  <span
                    class={hasSecondPart ? "text-sky-300" : "text-amber-400/70"}
                  >
                    {firstPart}
                  </span>
                  {hasSecondPart ? ":" : ""}
                  {hasSecondPart && (
                    <span class="text-amber-400/70">{secondPart}</span>
                  )}
                </a>
              )}
              {isNil(path.url) && (
                <>
                  <span
                    class={hasSecondPart ? "text-sky-300" : "text-amber-400/70"}
                  >
                    {firstPart}
                  </span>
                  {hasSecondPart ? ":" : ""}
                  {hasSecondPart && (
                    <span class="text-amber-400/70">{secondPart}</span>
                  )}
                </>
              )}{" "}
              |{" "}
              <span class="text-slate-300">
                {swebokFocusMap.get(path.swebokFocus)}
              </span>
            </span>

            <CourseList
              courses={path.courses}
              getCount={() => counter.getCount()}
            />
          </li>
        );
      })}
    </ul>
  );
};
