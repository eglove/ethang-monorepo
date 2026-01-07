import { useQuery } from "@apollo/client/react";
import { Listbox, ListboxItem } from "@heroui/react";
import get from "lodash/get.js";

import {
  type GetPathCourseIds,
  getPathCourseIds,
} from "../../graphql/queries.ts";
import { CourseItem } from "./course-item.tsx";

type CourseListProperties = {
  pathId: string;
};

export const CourseList = ({ pathId }: Readonly<CourseListProperties>) => {
  const { data, loading } = useQuery<GetPathCourseIds>(getPathCourseIds, {
    variables: { id: pathId },
  });

  const path = get(data, ["path"]);
  const courses = get(path, ["courses"], []);

  return (
    <Listbox
      variant="flat"
      items={courses}
      className="gap-0 p-0"
      aria-label="Course List"
      emptyContent={loading ? "Loading..." : "No courses found."}
    >
      {(course) => {
        const courseId = get(course, ["id"]);

        return (
          <ListboxItem
            key={courseId}
            textValue={courseId}
            className="h-auto px-2 py-1"
          >
            <CourseItem courseId={courseId} />
          </ListboxItem>
        );
      }}
    </Listbox>
  );
};
