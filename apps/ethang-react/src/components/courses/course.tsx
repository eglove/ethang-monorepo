import { useQuery } from "@apollo/client/react";
import { gql } from "@ethang/graphql-types/__generated__";
import { Link, Skeleton, Text } from "@radix-ui/themes";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";

type CourseProperties = {
  courseId: string;
  courseIndex: number;
};

export const Course = ({
  courseId,
  courseIndex
}: Readonly<CourseProperties>) => {
  const { data, loading } = useQuery(
    gql(`query Course($courseId: ID!) {
  course(id: $courseId) {
    id
    name
    url
    author
  }
}`),
    { variables: { courseId } }
  );
  const isPending = loading && isNil(data);

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
