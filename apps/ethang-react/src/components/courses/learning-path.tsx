import { gql } from "@ethang/graphql-types/__generated__";
import { courses as coursesIntl } from "@ethang/intl/en/courses.ts";
import {
  Badge,
  Card,
  Flex,
  Heading,
  Link,
  Skeleton,
  Text
} from "@radix-ui/themes";
import { queryOptions, useQuery } from "@tanstack/react-query";
import get from "lodash/get";
import isNil from "lodash/isNil";
import map from "lodash/map";

import { graphqlRequest } from "../../clients/graphql-client.ts";
import { Course } from "./course.tsx";

type LearningPathProperties = {
  courseOffset: number;
  learningPathId: string;
};

const swebokFocusMap = new Map([
  ["architecture", "Software Architecture"],
  ["certification", "Certification"],
  ["computing", "Computing Foundations"],
  ["construction", "Software Construction"],
  ["design", "Software Design"],
  ["economics", "Software Engineering Economics"],
  ["engineering-operations", "Software Engineering Operations"],
  ["engineering", "Engineering Foundations"],
  ["maintenance", "Software Maintenance"],
  ["management", "Software Engineering Management"],
  ["mathematical", "Mathematical Foundations"],
  ["models-methods", "Software Engineering Models and Methods"],
  ["process", "Software Engineering Process"],
  ["professional-practice", "Software Engineering Professional Practice"],
  ["quality", "Software Quality"],
  ["requirements", "Software Requirements"],
  ["scm", "Software Configuration Management"],
  ["security", "Software Security"],
  ["testing", "Software Testing"]
]);

export const learningPathQueryOptions = (learningPathId: string) => {
  return queryOptions({
    queryFn: async () => {
      return graphqlRequest(
        gql(`query LearningPath($learningPathId: ID!) {
            learningPath(id: $learningPathId) {
                url
                name
                id
                swebokFocus
                courses {
                    id
                }
            }
        }`),
        { learningPathId }
      );
    },
    queryKey: ["learningPath", learningPathId]
  });
};

export const LearningPath = ({
  courseOffset,
  learningPathId
}: Readonly<LearningPathProperties>) => {
  const { data, isPending } = useQuery(
    learningPathQueryOptions(learningPathId)
  );

  const url = get(data, ["learningPath", "url"]);
  const name = get(data, ["learningPath", "name"]);
  const swebokFocus = get(data, ["learningPath", "swebokFocus"]);
  const courses = get(data, ["learningPath", "courses"]);
  const courseLength = get(data, ["learningPath", "courses", "length"]);

  return (
    <Skeleton loading={isPending}>
      <Card>
        <Flex gap="3" wrap="wrap" align="center">
          <Heading as="h2" size="5">
            {isNil(url) ? (
              name
            ) : (
              <Link href={url} target="_blank" rel="noopener noreferrer">
                {name}
              </Link>
            )}
          </Heading>
          {!isNil(swebokFocus) && (
            <Badge variant="soft">
              {swebokFocusMap.get(swebokFocus) ?? swebokFocus}
            </Badge>
          )}
        </Flex>
        <Text as="p" mb="3" mt="1" color="gray">
          {courseLength}{" "}
          {1 === courseLength ? coursesIntl.COURSE : coursesIntl.COURSES}
        </Text>
        <Flex asChild gap="1" direction="column">
          <ul>
            {map(courses, (course, index) => {
              const courseIndex = courseOffset + 1 + index;

              return (
                <Course
                  key={course.id}
                  courseId={course.id}
                  courseIndex={courseIndex}
                />
              );
            })}
          </ul>
        </Flex>
      </Card>
    </Skeleton>
  );
};
