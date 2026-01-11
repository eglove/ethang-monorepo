import { useQuery } from "@apollo/client/react";
import {
  Accordion,
  AccordionItem,
  Button,
  Link,
  Skeleton,
} from "@heroui/react";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import { SquareArrowOutUpRight } from "lucide-react";

import { type GetPaths, getPaths } from "../../graphql/queries.ts";
import { CourseList } from "./course-list.tsx";

export const CoursesContainer = () => {
  const { data, loading } = useQuery<GetPaths>(getPaths);

  const paths = get(data, ["paths"]);
  const isLoaded = !loading && paths !== undefined;

  return (
    <Skeleton className="my-4" isLoaded={isLoaded}>
      <Accordion
        variant="splitted"
        itemClasses={{ trigger: "cursor-pointer p-2" }}
      >
        {map(paths, (path) => {
          const pathId = get(path, ["id"]);
          const url = get(path, ["url"]);
          const names = split(get(path, ["name"]), ":");

          return (
            <AccordionItem
              key={pathId}
              subtitle={`${get(path, ["_count", "courses"], 0)} courses`}
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
                  isDisabled={isNil(url)}
                  href={isNil(url) ? "" : url}
                  aria-label={`View ${get(path, ["name"])}`}
                >
                  <SquareArrowOutUpRight />
                </Button>
              }
            >
              <CourseList pathId={pathId} />
            </AccordionItem>
          );
        })}
      </Accordion>
    </Skeleton>
  );
};
