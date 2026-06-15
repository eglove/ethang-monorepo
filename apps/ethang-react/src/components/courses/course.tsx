import { gql } from "@ethang/graphql-types/__generated__";
import { Link, Skeleton, Text } from "@radix-ui/themes";
import { queryOptions, useQuery } from "@tanstack/react-query";
import get from "lodash/get.js";

import { graphqlRequest } from "../../clients/graphql-client.ts";

type CourseProperties = {
  courseId: string;
  courseIndex: number;
};

export const courseQueryOptions = (courseId: string) => {
  return queryOptions({
    queryFn: async () => {
      return graphqlRequest(
        gql(`query Course($courseId: ID!) {
            course(id: $courseId) {
                id
                url
                name
                author
            }
        }`),
        { courseId }
      );
    },
    queryKey: ["course", courseId]
  });
};

export const Course = ({
  courseId,
  courseIndex
}: Readonly<CourseProperties>) => {
  const { data, isPending } = useQuery(courseQueryOptions(courseId));

  const link = get(data, ["course", "url"]);
  const name = get(data, ["course", "name"]);
  const author = get(data, ["course", "author"]);

  return (
    <Skeleton loading={isPending}>
      <li>
        <Text as="span">{courseIndex}. </Text>
        <Link href={link} target="_blank">
          {name}
        </Link>{" "}
        <Text as="span" color="gray">
          by {author}
        </Text>
      </li>
    </Skeleton>
  );
};
