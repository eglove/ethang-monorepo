import { useQuery as useApolloQuery } from "@apollo/client/react";
import { gql } from "@ethang/graphql-types/__generated__";
import { Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import forEach from "lodash/forEach.js";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import map from "lodash/map";
import { DateTime } from "luxon";

import { courseStore } from "../components/courses/course-store.ts";
import { LearningPath } from "../components/courses/learning-path.tsx";
import { MainLayout } from "../components/layout/main-layout.tsx";

const RouteComponent = () => {
  const { data, loading } = useApolloQuery(
    gql(`query GetRecommendedCoursesLearningPathIds {
  curriculum(id: "019e9dc1-b3bf-7039-a8e2-e6d7f25be6e4") {
    id
    name
    updatedAt
    learningPaths {
      id
        courses {
            id
        }
    }
  }
}`)
  );

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
      <Skeleton loading={loading}>
        <Heading mb="2" as="h1" size="8">
          {get(data, ["curriculum", "name"])}
        </Heading>
      </Skeleton>
      <Skeleton loading={loading}>
        <Text as="p" mb="4">
          Last Updated: {formattedDate}
        </Text>
      </Skeleton>
      <Skeleton loading={loading}>
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
