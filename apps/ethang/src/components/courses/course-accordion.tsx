import { useQuery } from "@apollo/client/react";
import { Accordion, AccordionItem, Skeleton } from "@heroui/react";
import get from "lodash/get.js";
import includes from "lodash/includes.js";
import map from "lodash/map.js";

import { getPathIds, type PathIdsQuery } from "../../graphql/paths.ts";
import { CourseList } from "./course-list.tsx";

type CourseAccordionProperties = {
  pathIds: string[];
};

export const CourseAccordion = ({
  pathIds,
}: Readonly<CourseAccordionProperties>) => {
  const { data, loading } = useQuery<PathIdsQuery>(getPathIds);

  const paths = get(data, ["paths"]);
  const isLoaded = !loading && paths !== undefined;

  return (
    <Skeleton isLoaded={isLoaded}>
      <Accordion variant="splitted">
        {map(paths, (path) => {
          const pathId = get(path, ["id"]);

          if (!includes(pathIds, pathId)) {
            return null;
          }

          return (
            <AccordionItem
              key={pathId}
              title={get(path, ["name"], "Loading...")}
              subtitle={`${get(path, ["courseCount"], 0)} courses`}
            >
              <CourseList pathId={pathId} />
            </AccordionItem>
          );
        })}
      </Accordion>
    </Skeleton>
  );
};
