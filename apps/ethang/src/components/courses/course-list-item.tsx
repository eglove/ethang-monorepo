import { Link } from "@heroui/react";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import { Activity, type PropsWithChildren } from "react";

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
      <Activity mode={isEmpty(courseList) ? "hidden" : "visible"}>
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
      </Activity>
    </>
  );
};
