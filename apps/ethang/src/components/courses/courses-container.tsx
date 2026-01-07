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
import { SquareArrowOutUpRight } from "lucide-react";
import { useEffect } from "react";

import { apolloClient } from "../../graphql/client.ts";
import {
  type GetCourses,
  getCourses,
  type GetPaths,
  getPaths,
} from "../../graphql/queries.ts";
import { CourseList } from "./course-list.tsx";

export const CoursesContainer = () => {
  const { data, loading } = useQuery<GetPaths>(getPaths);

  const paths = get(data, ["paths"]);
  const isLoaded = !loading && paths !== undefined;

  useEffect(() => {
    apolloClient
      .query<GetCourses>({ query: getCourses })
      .catch(globalThis.console.error);
  }, []);

  return (
    <Skeleton className="my-4" isLoaded={isLoaded}>
      <Accordion
        variant="splitted"
        itemClasses={{ trigger: "cursor-pointer p-2" }}
      >
        {map(paths, (path) => {
          const pathId = get(path, ["id"]);
          const url = get(path, ["url"]);

          return (
            <AccordionItem
              key={pathId}
              title={get(path, ["name"], "Loading...")}
              subtitle={`${get(path, ["_count", "courses"], 0)} courses`}
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
