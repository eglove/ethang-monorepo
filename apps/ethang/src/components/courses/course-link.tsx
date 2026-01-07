import { useQuery } from "@apollo/client/react";
import { Link, Skeleton } from "@heroui/react";
import get from "lodash/get.js";

import { type CourseQuery, getCourse } from "../../graphql/course.ts";

type CourseLinkProperties = {
  courseId: string;
};

export const CourseLink = ({ courseId }: Readonly<CourseLinkProperties>) => {
  const { data, loading } = useQuery<CourseQuery>(getCourse, {
    variables: { id: courseId },
  });

  const course = get(data, ["course"]);
  const isLoaded = !loading && course !== undefined;

  return (
    <Skeleton isLoaded={isLoaded} className="rounded-lg">
      <Link
        isExternal
        showAnchorIcon
        color="foreground"
        href={get(course, ["url"], "")}
      >
        {get(course, ["name"], "")} ({get(course, ["author"], "")})
      </Link>
    </Skeleton>
  );
};
