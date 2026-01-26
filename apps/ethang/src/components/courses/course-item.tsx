import { Link, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import get from "lodash/get.js";

import { getCourse } from "../../sanity/queries.ts";

type CourseItemProperties = {
  courseId: string;
};

export const CourseItem = ({ courseId }: Readonly<CourseItemProperties>) => {
  const { data, isPending } = useQuery(getCourse(courseId));

  return (
    <Skeleton isLoaded={!isPending} className="rounded-lg">
      <div className="flex min-w-0 flex-1 flex-col">
        <div>
          <Link
            size="sm"
            isExternal
            color="foreground"
            href={get(data, ["url"], "")}
            className="text-small font-medium"
          >
            {get(data, ["name"], "")}
          </Link>
        </div>
        <span className="truncate text-tiny text-default-400">
          {get(data, ["author"], "")}
        </span>
      </div>
    </Skeleton>
  );
};
