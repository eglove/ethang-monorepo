import {
  Accordion,
  AccordionItem,
  Button,
  Link,
  Skeleton,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import { SquareArrowOutUpRight } from "lucide-react";

import { getPaths } from "../../sanity/queries.ts";
import { CourseList } from "./course-list.tsx";

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

          return (
            <AccordionItem
              key={path._id}
              textValue={path.name}
              subtitle={`${path.courseCount} courses`}
              title={
                <span>
                  {names[0]}
                  {isNil(names[1]) ? "" : ":"}
                  <span className="text-amber-500">{names[1]}</span>
                </span>
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
              <CourseList pathId={path._id} />
            </AccordionItem>
          );
        })}
      </Accordion>
    </Skeleton>
  );
};
