import { Link, Text } from "@astryxdesign/core";

import type { CourseData } from "./course.ts";

type CourseProperties = {
  course: CourseData;
};

export const Course = ({ course }: Readonly<CourseProperties>) => {
  return (
    <li>
      <Text as="span">
        {course.courseIndex}.{" "}
        <Link target="_blank" href={course.url} rel="noopener noreferrer">
          {course.name}
        </Link>{" "}
      </Text>
      <Text as="span" color="secondary">
        by {course.author}
      </Text>
    </li>
  );
};
