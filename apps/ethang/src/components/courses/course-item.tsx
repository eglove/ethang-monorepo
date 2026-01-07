import { useQuery } from "@apollo/client/react";
import { Link, Skeleton } from "@heroui/react";
import get from "lodash/get.js";

import { type CourseQuery, getCourse } from "../../graphql/course.ts";

type CourseItemProperties = {
  courseId: string;
};

export const CourseItem = ({ courseId }: Readonly<CourseItemProperties>) => {
  const { data, loading } = useQuery<CourseQuery>(getCourse, {
    variables: { id: courseId },
  });

  const course = get(data, ["course"]);
  const isLoaded = !loading && course !== undefined;

  return (
    <Skeleton isLoaded={isLoaded} className="rounded-lg">
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          size="sm"
          isExternal
          color="foreground"
          href={get(course, ["url"], "")}
          className="text-small font-medium"
        >
          {get(course, ["name"], "")}
        </Link>
        <span className="truncate text-tiny text-default-400">
          {get(course, ["author"], "")}
        </span>
      </div>
    </Skeleton>
  );
};
