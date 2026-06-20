import { gql } from "@ethang/graphql-types/__generated__";
import { courses as coursesIntl } from "@ethang/intl/en/courses.ts";
import { Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import forEach from "lodash/forEach.js";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map";
import { DateTime } from "luxon";

import { graphqlRequest } from "../clients/graphql-client.ts";
import { courseStore } from "../components/courses/course-store.ts";
import { LearningPath } from "../components/courses/learning-path.tsx";
import { MainLayout } from "../components/layout/main-layout.tsx";

export const curriculumQueryOptions = () => {
  return queryOptions({
    queryFn: async () => {
      return graphqlRequest(
        gql(`query Curriculum($curriculumId: ID!) {
            curriculum(id: $curriculumId) {
                id
                updatedAt
                learningPaths {
                    id
                    courses {
                        id
                    }
                }
            }
        }`),
        { curriculumId: "019e9dc1-b3bf-7039-a8e2-e6d7f25be6e4" }
      );
    },
    queryKey: ["curriculum", "019e9dc1-b3bf-7039-a8e2-e6d7f25be6e4"]
  });
};

const RouteComponent = () => {
  const { data, isPending } = useQuery(curriculumQueryOptions());

  const latestUpdate = get(data, ["curriculum", "updatedAt"]);
  courseStore.reset();

  const formattedDate = isNil(latestUpdate)
    ? ""
    : DateTime.fromISO(latestUpdate).toLocaleString({
        dateStyle: "medium",
        timeStyle: "long"
      });

  const pathOffsets: Record<string, number> = {};
  let totalCount = 0;
  forEach(get(data, ["curriculum", "learningPaths"]), (learningPath) => {
    pathOffsets[learningPath.id] = totalCount;
    totalCount += learningPath.courses.length;
  });

  return (
    <MainLayout>
      <Skeleton loading={isPending}>
        <Heading mb="2" as="h1" size="8">
          {get(data, ["curriculum", "name"])}
        </Heading>
      </Skeleton>
      <Skeleton loading={isPending}>
        <Text as="p" mb="4">
          {coursesIntl.LAST_UPDATED} {formattedDate}
        </Text>
      </Skeleton>
      <Skeleton loading={isPending}>
        <Flex my="6" gap="4" direction="column">
          {map(get(data, ["curriculum", "learningPaths"]), (learningPath) => {
            return (
              <LearningPath
                key={learningPath.id}
                learningPathId={learningPath.id}
                courseOffset={get(pathOffsets, [learningPath.id], 0)}
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
