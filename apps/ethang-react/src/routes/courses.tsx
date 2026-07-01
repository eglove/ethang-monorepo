import { Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import groupBy from "lodash/groupBy";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import isNil from "lodash/isNil.js";

import { rpcRequest } from "../clients/rpc-client.ts";
import { courseStore } from "../components/courses/course-store.ts";
import { LearningPath } from "../components/courses/learning-path.tsx";
import { MainLayout } from "../components/layout/main-layout.tsx";

const COURSES_SERVICE = "ethang_courses";

export const coursesAllQueryOptions = () => {
  return queryOptions({
    queryFn: async () => {
      return rpcRequest<
        {
          author: string;
          courseId: string;
          courseIndex: number;
          learningPathId: string;
          learningPathName: null | string;
          learningPathOrder: number;
          learningPathUrl: null | string;
          name: string;
          swebokFocus: null | string;
          url: string;
        }[]
      >(COURSES_SERVICE, "coursesAll", {});
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

  // Group courses by learning path
  const coursesByLearningPath: Record<string, any[]> = groupBy(
    data,
    "learningPathId"
  );

  // Calculate offsets for numbering within learning paths
  const pathOffsets: Record<string, number> = {};
  const learningPathOrder: Record<
    string,
    { name: null | string; swebokFocus: null | string; url: null | string }
  > = {};

  // Sort learning paths by the first course's learningPathOrder
  const uniqueLearningPaths = [
    ...new Set(
      data.map((course) => {
        return course.learningPathId;
      })
    )
  ];

  for (const lpId of uniqueLearningPaths) {
    const lpCourses = coursesByLearningPath[lpId];
    if (0 < lpCourses.length) {
      // Sort by learningPathOrder to ensure consistent ordering
      const sortedCourses = [...lpCourses].sort((a, b) => {
        return a.learningPathOrder - b.learningPathOrder;
      });

      // Store the first course's learningPathOrder as the offset reference
      pathOffsets[lpId] = sortedCourses[0].courseIndex - 1; // Adjust for 0-based indexing

      // Find learning path name and swebokFocus from first course
      const firstCourse = sortedCourses[0];
      learningPathOrder[lpId] = {
        name: firstCourse.learningPathName,
        swebokFocus: firstCourse.swebokFocus,
        url: null // We don't have URL in our coursesAll response, need to fix this
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
          {/* We'll need to fetch updatedAt separately or include it in coursesAll response */}
          Last Updated: {new Date().toLocaleString()}
        </Text>
      </Skeleton>
      <Skeleton loading={isPending}>
        <Flex my="6" gap="4" direction="column">
          {Object.entries(coursesByLearningPath).map(
            ([learningPathId, value]) => {
              const lpInfo = learningPathOrder[learningPathId] || {
                name: "Unknown",
                swebokFocus: null
              };
              return (
                <LearningPath
                  key={learningPathId}
                  courses={value || []}
                  learningPathUrl={lpInfo.url} // This will be null until we fix the response
                  learningPathName={lpInfo.name}
                  learningPathId={learningPathId}
                  learningPathSwebokFocus={lpInfo.swebokFocus}
                  courseOffset={pathOffsets[learningPathId] || 0}
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
