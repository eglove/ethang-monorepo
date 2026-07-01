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
import filter from "lodash/filter";
import isNil from "lodash/isNil";
import map from "lodash/map";

import { rpcRequest } from "../../clients/rpc-client.ts";
import { Course } from "./course.tsx";

export type AllCourseData = {
  author: string;
  courseId: string;
  courseIndex: number;
  learningPathId: string;
  learningPathName: null | string;
  learningPathOrder: number;
  learningPathUrl: null | string;
  name: string;
  swebokFocus: null | string;
  updatedAt: string;
  url: string;
};

type LearningPathProperties = {
  learningPathId: string;
};

export const coursesAllQueryOptions = () => {
  return queryOptions({
    queryFn: async () => {
      return rpcRequest<AllCourseData[]>("ethang_courses", "coursesAll", {});
    },
    queryKey: ["coursesAll"]
  });
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

const selectPathCourses = (learningPathId: string) => {
  return (allCourses: AllCourseData[]) => {
    return filter(allCourses, { learningPathId });
  };
};

export const LearningPath = ({
  learningPathId
}: Readonly<LearningPathProperties>) => {
  const { data: courses, isPending } = useQuery({
    ...coursesAllQueryOptions(),
    select: selectPathCourses(learningPathId)
  });

  const [firstCourse] = courses ?? [];
  const name = firstCourse?.learningPathName;
  const swebokFocus = firstCourse?.swebokFocus;
  const url = firstCourse?.learningPathUrl;
  const courseLength = courses?.length;

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
            {map(courses, (course) => {
              return (
                <Course key={course.courseId} courseId={course.courseId} />
              );
            })}
          </ul>
        </Flex>
      </Card>
    </Skeleton>
  );
};
