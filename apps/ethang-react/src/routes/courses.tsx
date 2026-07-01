import { Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import groupBy from "lodash/groupBy";
import isNil from "lodash/isNil.js";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import map from "lodash/map.js";
import orderBy from "lodash/orderBy.js";
import { DateTime } from "luxon";

import { rpcRequest } from "../clients/rpc-client.ts";
import { LearningPath } from "../components/courses/learning-path.tsx";
import { MainLayout } from "../components/layout/main-layout.tsx";

type CourseData = {
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

type LearningPathInfo = {
  name: null | string;
  swebokFocus: null | string;
  url: null | string;
};

const COURSES_SERVICE = "ethang_courses";

export const coursesAllQueryOptions = () => {
  return queryOptions({
    queryFn: async () => {
      return rpcRequest<CourseData[]>(COURSES_SERVICE, "coursesAll", {});
    },
    queryKey: ["coursesAll"]
  });
};

const RouteComponent = () => {
  const { data, isPending } = useQuery(coursesAllQueryOptions());

  if (isPending || isNil(data)) {
    return (
      <MainLayout>
        <Skeleton loading>
          <Heading mb="2" as="h1" size="8">
            Courses
          </Heading>
        </Skeleton>
      </MainLayout>
    );
  }

  // Find the most recently updated course
  const latestUpdatedAt =
    data.toSorted((a, b) => {
      return b.updatedAt.localeCompare(a.updatedAt);
    })[0]?.updatedAt ?? "";

  const dateString = DateTime.fromISO(latestUpdatedAt).toLocaleString(
    DateTime.DATETIME_FULL
  );

  // Group courses by learning path
  const coursesByLearningPath = groupBy(data, "learningPathId") as Record<
    string,
    CourseData[]
  >;

  // Calculate offsets for numbering within learning paths
  const learningPathOrder: Record<string, LearningPathInfo> = {};

  // Sort learning paths by the first course's learningPathOrder
  const uniqueLearningPaths = [
    ...new Set(
      map(data, (course) => {
        return course.learningPathId;
      })
    )
  ];

  for (const lpId of uniqueLearningPaths) {
    const lpCourses = coursesByLearningPath[lpId];
    if (!isNil(lpCourses) && 0 < lpCourses.length) {
      // Find learning path name and swebokFocus from first course
      const [firstCourse] = lpCourses.toSorted((a, b) => {
        return a.learningPathOrder - b.learningPathOrder;
      });
      learningPathOrder[lpId] = {
        name: firstCourse?.learningPathName ?? "",
        swebokFocus: firstCourse?.swebokFocus ?? "",
        url: firstCourse?.learningPathUrl ?? null
      };
    }
  }

  return (
    <MainLayout>
      <Skeleton loading={isPending}>
        <Heading mb="2" as="h1" size="8">
          Courses
        </Heading>
      </Skeleton>
      <Skeleton loading={isPending}>
        <Text as="p" mb="4">
          Last Updated: {dateString}
        </Text>
      </Skeleton>
      <Skeleton loading={isPending}>
        <Flex my="6" gap="4" direction="column">
          {map(
            orderBy(Object.entries(coursesByLearningPath), ([, courses]) => {
              return courses[0]?.learningPathOrder;
            }),
            ([learningPathId]) => {
              return (
                <LearningPath
                  key={learningPathId}
                  learningPathId={learningPathId}
                />
              );
            }
          )}
        </Flex>
      </Skeleton>
    </MainLayout>
  );
};

export const Route = createFileRoute("/courses")({
  component: RouteComponent
});
