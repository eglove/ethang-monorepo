import map from "lodash/map.js";

import { coursePathData } from "../../stores/course-path-store.ts";
import { List } from "../typography/list.tsx";
import { CourseItem } from "./course-item.tsx";

type CourseListProperties = {
  courseCount: number;
  pathId: string;
};

export const CourseList = async (properties: CourseListProperties) => {
  const courses = coursePathData.getLearningPathCourses(properties.pathId);

  return (
    <List className="max-w-none">
      {map(courses, async (course) => {
        return (
          <li>
            <CourseItem courseId={course._id} />
          </li>
        );
      })}
    </List>
  );
};
