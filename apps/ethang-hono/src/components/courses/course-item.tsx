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
      href={course.url}
      className="group flex flex-col transition-all hover:translate-x-2"
    >
      <span className="text-base tracking-tight text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
        {course.name}
      </span>
      <span class="mt-1 inline-flex items-center text-xs tracking-widest text-fuchsia-600 uppercase dark:text-fuchsia-400">
        <span class="mr-2 h-px w-4 bg-fuchsia-300 dark:bg-fuchsia-700"></span>
        {course.author}
      </span>
    </Link>
  );
};
