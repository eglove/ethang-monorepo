import isNil from "lodash/isNil.js";
import join from "lodash/join.js";
import map from "lodash/map.js";
import slice from "lodash/slice.js";
import split from "lodash/split.js";
import { v7 } from "uuid";

import { coursePathData } from "../../stores/course-path-store.ts";
import { AccordionBody } from "../accordion/accordion-body.tsx";
import { AccordionHeader } from "../accordion/accordion-header.tsx";
import { AccordionWrapper } from "../accordion/accordion-wrapper.tsx";
import { CourseList } from "./course-list.tsx";

const swebokFocusMap = new Map([
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
    <AccordionWrapper>
      {map(learningPaths, async (path) => {
        const bodyId = `body-${v7()}`;
        const headingId = `heading-${v7()}`;
        const names = split(path.name, ":");
        const [firstPart] = names;
        const secondPart = join(slice(names, 1), " ");

        return (
          <>
            <AccordionHeader
              bodyId={bodyId}
              headingId={headingId}
              classNames={{ childrenWrapper: "w-full" }}
            >
              <div class="grid items-center md:grid-cols-[1fr_auto]">
                <div class="grid place-items-start">
                  <div class="text-start">
                    {firstPart}
                    {isNil(secondPart) || "" === secondPart ? "" : ":"}
                    {!isNil(secondPart) && "" !== secondPart && (
                      <span className="text-warning">{secondPart}</span>
                    )}
                  </div>
                  <span class="text-cyan-500">{path.courseCount} courses</span>
                </div>
                <div class="text-start text-cyan-500">
                  {swebokFocusMap.get(path.swebokFocus)}
                </div>
              </div>
            </AccordionHeader>
            <AccordionBody bodyId={bodyId} headingId={headingId}>
              <CourseList pathId={path._id} courseCount={path.courseCount} />
            </AccordionBody>
          </>
        );
      })}
    </AccordionWrapper>
  );
};
