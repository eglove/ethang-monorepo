import {
  Accordion,
  AccordionItem,
  Button,
  Link,
  Skeleton,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import get from "lodash/get";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import { SquareArrowOutUpRight } from "lucide-react";

import { getPaths } from "../../sanity/queries.ts";
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

export const CoursesContainer = () => {
  const { data, isPending } = useQuery(getPaths());

  return (
    <Skeleton className="my-4" isLoaded={!isPending}>
      <Accordion
        variant="splitted"
        itemClasses={{ trigger: "cursor-pointer p-2" }}
      >
        {map(data, (path) => {
          const names = split(path.name, ":");
          const focus = swebokFocusMap.get(path.swebokFocus);

          return (
            <AccordionItem
              key={path._id}
              textValue={path.name}
              title={
                <span>
                  {names[0]}
                  {isNil(names[1]) ? "" : ":"}
                  <span className="text-amber-500">{names[1]}</span>
                </span>
              }
              subtitle={
                <div className="grid sm:grid-cols-[1fr_auto]">
                  <div>{get(path, ["courseCount"], 0)} courses</div>
                  {!isNil(focus) && (
                    <div className="text-primary-500">{focus}</div>
                  )}
                </div>
              }
              startContent={
                <Button
                  as={Link}
                  size="sm"
                  isExternal
                  isIconOnly
                  variant="bordered"
                  isDisabled={isNil(path.url)}
                  aria-label={`View ${path.name}`}
                  href={isNil(path.url) ? "" : path.url}
                >
                  <SquareArrowOutUpRight />
                </Button>
              }
            >
              <CourseList
                pathId={path._id}
                courseCount={get(path, ["courseCount"], 0)}
              />
            </AccordionItem>
          );
        })}
      </Accordion>
    </Skeleton>
  );
};
