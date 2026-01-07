import { useQuery } from "@apollo/client/react";
import get from "lodash/get.js";
import map from "lodash/map.js";

import { getPath, type PathQuery } from "../../graphql/paths.ts";
import { CourseLink } from "./course-link.tsx";

type CourseListProperties = {
  pathId: string;
};

export const CourseList = ({ pathId }: Readonly<CourseListProperties>) => {
  const { data } = useQuery<PathQuery>(getPath, {
    variables: { id: pathId },
  });

  const path = get(data, ["path"]);

  return (
    <ul className="list-inside list-disc">
      {map(get(path, ["courses"]), (course) => {
        const courseId = get(course, ["id"]);

        return (
          <li key={courseId} className="my-2">
            <CourseLink courseId={courseId} />
          </li>
        );
      })}
    </ul>
  );
};
