import { Fragment } from "hono/jsx";
import isNil from "lodash/isNil.js";

import { coursePathData } from "../../stores/course-path-store.ts";
import { Link } from "../typography/link.tsx";

type CourseItemProperties = {
  courseId: string;
};

export const CourseItem = async (properties: CourseItemProperties) => {
  const course = coursePathData.getCourse(properties.courseId);

  if (isNil(course)) {
    return <Fragment />;
  }

  return (
    <Link
      target="_blank"
      href={course.url}
      className="flex min-w-0 flex-1 flex-col rounded p-2 hover:bg-gray"
    >
      <span className="text-sm font-medium text-fg-brand-subtle">
        {course.name}
      </span>
      <span class="truncate text-xs text-shiki-fg-brand-subtle">
        {course.author}
      </span>
    </Link>
  );
};
