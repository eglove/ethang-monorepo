import { Heading, Text, VStack } from "@astryxdesign/core";
import { DateTime, Option } from "effect";
import constant from "lodash/constant.js";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { CourseData } from "./course.ts";

import { LearningPath } from "./learning-path.tsx";

type CoursesViewProperties = {
  courses: CourseData[];
};

export const CoursesView = ({ courses }: Readonly<CoursesViewProperties>) => {
  const latestUpdatedAt =
    filter(courses, (course): course is CourseData => {
      return !isNil(course.updatedAt);
    }).toSorted((a, b) => {
      return b.updatedAt.localeCompare(a.updatedAt);
    })[0]?.updatedAt ?? "";

  const dateString = Option.match(DateTime.make(latestUpdatedAt), {
    onNone: constant(""),
    onSome: (dt) => {
      return DateTime.format(dt, {
        dateStyle: "full",
        timeStyle: "long"
      });
    }
  });

  // Group courses by learning path, preserving backend sort order
  const grouped = new Map<string, CourseData[]>();
  for (const course of courses) {
    const existing = grouped.get(course.learningPathId);
    if (existing) {
      existing.push(course);
    } else {
      grouped.set(course.learningPathId, [course]);
    }
  }

  return (
    <div data-testid="courses-view" className="flex flex-col gap-4">
      <Heading level={1}>Courses</Heading>
      {"" !== dateString && (
        <Text as="p" color="secondary">
          Last Updated: {dateString}
        </Text>
      )}
      <VStack gap={4}>
        {map(grouped.keys().toArray(), (learningPathId) => {
          return (
            <LearningPath
              key={learningPathId}
              learningPathId={learningPathId}
              courses={grouped.get(learningPathId) ?? []}
            />
          );
        })}
      </VStack>
    </div>
  );
};
