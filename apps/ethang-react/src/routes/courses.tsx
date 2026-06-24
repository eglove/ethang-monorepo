import { courses as coursesIntl } from "@ethang/intl/en/courses.ts";
import { Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import forEach from "lodash/forEach.js";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import isNil from "lodash/isNil.js";
import map from "lodash/map";
import { DateTime } from "luxon";

import { rpcRequest } from "../clients/rpc-client.ts";
import { courseStore } from "../components/courses/course-store.ts";
import { LearningPath } from "../components/courses/learning-path.tsx";
import { MainLayout } from "../components/layout/main-layout.tsx";

const COURSES_SERVICE = "ethang_courses";

export const curriculumQueryOptions = () => {
  return queryOptions({
    queryFn: async () => {
      return rpcRequest<{
        id: string;
        learningPaths: { courses: { id: string }[]; id: string }[];
        name?: string;
        updatedAt: string;
      }>(COURSES_SERVICE, "curriculum", {
        id: "019e9dc1-b3bf-7039-a8e2-e6d7f25be6e4"
      });
    },
    queryKey: ["curriculum", "019e9dc1-b3bf-7039-a8e2-e6d7f25be6e4"]
  });
};

const RouteComponent = () => {
  const { data, isPending } = useQuery(curriculumQueryOptions());

  const latestUpdate = data?.updatedAt;
  courseStore.reset();

  const formattedDate = isNil(latestUpdate)
    ? ""
    : DateTime.fromISO(latestUpdate).toLocaleString({
        dateStyle: "medium",
        timeStyle: "long"
      });

  const pathOffsets: Record<string, number> = {};
  let totalCount = 0;
  forEach(data?.learningPaths, (learningPath) => {
    pathOffsets[learningPath.id] = totalCount;
    totalCount += learningPath.courses.length;
  });

  return (
    <MainLayout>
      <Skeleton loading={isPending}>
        <Heading mb="2" as="h1" size="8">
          {data?.name}
        </Heading>
      </Skeleton>
      <Skeleton loading={isPending}>
        <Text as="p" mb="4">
          {coursesIntl.LAST_UPDATED} {formattedDate}
        </Text>
      </Skeleton>
      <Skeleton loading={isPending}>
        <Flex my="6" gap="4" direction="column">
          {map(data?.learningPaths, (learningPath) => {
            return (
              <LearningPath
                key={learningPath.id}
                learningPathId={learningPath.id}
                courseOffset={pathOffsets[learningPath.id] ?? 0}
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
