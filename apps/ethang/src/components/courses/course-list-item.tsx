import type { PropsWithChildren } from "react";

import { Link } from "@heroui/react";
import map from "lodash/map";

import { TypographyOrderedList } from "../typography/typography-list.tsx";

type CourseListItemProperties = {
  courseList: { name: string; url: string }[];
};

export const CourseListItem = ({
  children,
  courseList,
}: Readonly<PropsWithChildren<CourseListItemProperties>>) => {
  return (
    <>
      {children}
      <TypographyOrderedList>
        {map(courseList, (course) => {
          return (
            <li key={course.name}>
              <Link
                isExternal
                className="text-foreground"
                href={course.url}
                underline="always"
              >
                {course.name}
              </Link>
            </li>
          );
        })}
      </TypographyOrderedList>
    </>
  );
};
