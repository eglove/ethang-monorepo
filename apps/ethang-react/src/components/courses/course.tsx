import { courses as coursesIntl } from "@ethang/intl/en/courses.ts";
import { Link, Skeleton, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import find from "lodash/find.js";

import {
  type AllCourseData,
  coursesAllQueryOptions
} from "./learning-path.tsx";

export type CourseProperties = {
  courseId: string;
};

const selectCourse = (courseId: string) => {
  return (allCourses: AllCourseData[]) => {
    return find(allCourses, { courseId });
  };
};

export const Course = ({ courseId }: Readonly<CourseProperties>) => {
  const { data: course, isPending } = useQuery({
    ...coursesAllQueryOptions(),
    select: selectCourse(courseId)
  });

  const index = course?.courseIndex;
  const link = course?.url;
  const name = course?.name;
  const author = course?.author;

  return (
    <Skeleton loading={isPending}>
      <li>
        <Text as="span">{index}. </Text>
        <Link href={link} target="_blank">
          {name}
        </Link>{" "}
        <Text as="span" color="gray">
          {coursesIntl.BY} {author}
        </Text>
      </li>
    </Skeleton>
  );
};
