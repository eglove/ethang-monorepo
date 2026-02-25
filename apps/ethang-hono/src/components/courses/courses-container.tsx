import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import { v7 } from "uuid";

import { coursePathData } from "../../path-data/course-path-data.ts";
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

        return (
          <>
            <AccordionHeader
              bodyId={bodyId}
              headingId={headingId}
              classNames={{ childrenWrapper: "w-full" }}
            >
              <div class="flex justify-between items-center">
                <div class="grid place-items-start">
                  <div>
                    <span>
                      {names[0]}
                      {isNil(names[1]) ? "" : ":"}
                      <span className="text-warning">{names[1]}</span>
                    </span>
                  </div>
                  <span class="text-cyan-500">{path.courseCount} courses</span>
                </div>
                <div class="text-cyan-500">
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
