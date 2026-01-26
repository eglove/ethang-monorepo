import { Listbox, ListboxItem } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { getCourseIds } from "../../sanity/queries.ts";
import { CourseItem } from "./course-item.tsx";

type CourseListProperties = {
  pathId: string;
};

export const CourseList = ({ pathId }: Readonly<CourseListProperties>) => {
  const { data, isPending } = useQuery(getCourseIds(pathId));

  return (
    <Listbox
      variant="flat"
      items={data ?? []}
      className="gap-0 p-0"
      aria-label="Course List"
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
  );
};
