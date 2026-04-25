import type { HtmlEscapedString } from "hono/utils/html";

import isNil from "lodash/isNil.js";

import { coursePathData } from "../../stores/course-path-store.ts";
import { Link } from "../typography/link.tsx";

type CourseItemProperties = {
  courseId: string;
};

export const CourseItem = async (properties: CourseItemProperties) => {
  const course = coursePathData.getCourse(properties.courseId);

  if (isNil(course)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return "" as HtmlEscapedString;
  }

  return (
    <Link href={course.url} className="underline underline-offset-2">
      <span>{course.name}</span>
    </Link>
  );
};
