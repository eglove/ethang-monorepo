import { Listbox, ListboxItem, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import isArray from "lodash/isArray.js";

import { getCourseIds } from "../../sanity/queries.ts";
import { CourseItem } from "./course-item.tsx";

type CourseListProperties = {
  courseCount: number;
  pathId: string;
};

export const CourseList = ({
  courseCount,
  pathId,
}: Readonly<CourseListProperties>) => {
  const { data, isPending } = useQuery(getCourseIds(pathId));

  return (
    <Skeleton
      isLoaded={!isPending}
      style={{ minHeight: `${courseCount * 45}px` }}
    >
      <Listbox
        variant="flat"
        className="gap-0 p-0"
        aria-label="Course List"
        items={isArray(data) ? data : []}
        emptyContent={isPending ? "Loading..." : "No courses found."}
      >
        {(course) => {
          return (
            <ListboxItem
              key={course._id}
              textValue={course._id}
              className="h-auto px-2 py-1"
            >
              <CourseItem courseId={course._id} />
            </ListboxItem>
          );
        }}
      </Listbox>
    </Skeleton>
  );
};
