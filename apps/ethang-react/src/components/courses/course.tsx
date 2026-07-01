import { courses as coursesIntl } from "@ethang/intl/en/courses.ts";
import { Link, Skeleton, Text } from "@radix-ui/themes";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { rpcRequest } from "../../clients/rpc-client.ts";

const COURSES_SERVICE = "ethang_courses";

export const courseQueryOptions = (courseId: string) => {
  return queryOptions({
    queryFn: async () => {
      return rpcRequest<{
        author: string;
        id: string;
        name: string;
        url: string;
      }>(COURSES_SERVICE, "course", { id: courseId });
    },
    queryKey: ["course", courseId]
  });
};

export const coursesAllQueryOptions = () => {
  return queryOptions({
    queryFn: async () => {
      return rpcRequest(COURSES_SERVICE, "coursesAll");
    },
    queryKey: ["coursesAll"]
  });
};

export type CourseProperties = {
  courseId: string;
};

export const Course = ({ courseId }: Readonly<CourseProperties>) => {
  const { data: course, isPending } = useQuery(courseQueryOptions(courseId));
  const { data: allCourses, isLoading } = useQuery(coursesAllQueryOptions());

  const index =
    allCourses?.findIndex((c) => {
      return c.id === courseId;
    }) ?? 0;
  const link = course?.url;
  const name = course?.name;
  const author = course?.author;

  return (
    <Skeleton loading={isPending || isLoading}>
      <li>
        <Text as="span">{index + 1}. </Text>
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
