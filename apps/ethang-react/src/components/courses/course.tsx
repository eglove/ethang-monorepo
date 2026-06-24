import { courses as coursesIntl } from "@ethang/intl/en/courses.ts";
import { Link, Skeleton, Text } from "@radix-ui/themes";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { rpcRequest } from "../../clients/rpc-client.ts";

const COURSES_SERVICE = "ethang_courses";

type CourseProperties = {
  courseId: string;
  courseIndex: number;
};

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

export const Course = ({
  courseId,
  courseIndex
}: Readonly<CourseProperties>) => {
  const { data, isPending } = useQuery(courseQueryOptions(courseId));

  const link = data?.url;
  const name = data?.name;
  const author = data?.author;

  return (
    <Skeleton loading={isPending}>
      <li>
        <Text as="span">{courseIndex}. </Text>
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
