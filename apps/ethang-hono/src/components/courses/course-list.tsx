import map from "lodash/map.js";

import { CourseItem } from "./course-item.tsx";

type CourseListProperties = {
  courses: { _id: string }[];
};

export const CourseList = async (properties: CourseListProperties) => {
  return (
    <ul class="mt-2 list-inside list-decimal space-y-1 ps-5">
      {map(properties.courses, async (course) => (
        <li key={course._id}>
          <CourseItem courseId={course._id} />
        </li>
      ))}
    </ul>
  );
};
