import { Badge, Card, Heading, Link, Text, VStack } from "@astryxdesign/core";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import { type CourseData, swebokFocusMap } from "./course.ts";
import { Course } from "./course.tsx";

type LearningPathProperties = {
  courses: CourseData[];
  learningPathId: string;
};

const sortByCourseIndex = (a: CourseData, b: CourseData) => {
  return a.courseIndex - b.courseIndex;
};

export const LearningPath = ({
  courses,
  learningPathId
}: Readonly<LearningPathProperties>) => {
  const [firstCourse] = courses;
  const name = firstCourse?.learningPathName;
  const swebokFocus = firstCourse?.swebokFocus;
  const url = firstCourse?.learningPathUrl;
  const courseLength = courses.length;

  return (
    <Card data-learning-path={learningPathId}>
      <VStack gap={2}>
        <Heading level={2} data-learning-path-name="">
          {isNil(url) ? (
            name
          ) : (
            <Link href={url} target="_blank" rel="noopener noreferrer">
              {name}
            </Link>
          )}
        </Heading>
        {!isNil(swebokFocus) && (
          <div>
            <Badge
              variant="neutral"
              label={swebokFocusMap.get(swebokFocus) ?? swebokFocus}
            />
          </div>
        )}
        <Text as="p" color="secondary" data-course-count="">
          {courseLength} {1 === courseLength ? "course" : "courses"}
        </Text>
        <ul className="space-y-2">
          {map(courses.toSorted(sortByCourseIndex), (course) => {
            return <Course course={course} key={course.courseId} />;
          })}
        </ul>
      </VStack>
    </Card>
  );
};
