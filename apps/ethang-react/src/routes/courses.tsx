import { Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import filter from "lodash/filter";
import isNil from "lodash/isNil.js";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import map from "lodash/map";
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
    filter(data, (item): item is { updatedAt: string } & CourseData => {
      return !isNil(item.updatedAt);
    }).toSorted((a, b) => {
      return b.updatedAt.localeCompare(a.updatedAt);
    })[0]?.updatedAt ?? "";

  const dateString = DateTime.fromISO(latestUpdatedAt).toLocaleString(
    DateTime.DATETIME_FULL
  );

  // Group courses by learning path, preserving backend sort order
  const learningPathsData = new Map<string, CourseData[]>();
  for (const course of data) {
    const existing = learningPathsData.get(course.learningPathId);
    if (existing) {
      existing.push(course);
    } else {
      learningPathsData.set(course.learningPathId, [course]);
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
          {map(learningPathsData.keys().toArray(), (learningPathId) => {
            return (
              <LearningPath
                key={learningPathId}
                learningPathId={learningPathId}
              />
            );
          })}
        </Flex>
      </Skeleton>
    </MainLayout>
  );
};

export const Route = createFileRoute("/courses")({
  component: RouteComponent
});
