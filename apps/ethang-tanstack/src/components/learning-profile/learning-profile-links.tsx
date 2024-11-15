import { Link } from "@nextui-org/link";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map.js";

import { learningProfilesQuery } from "../../query/learning-profiles";

export const LearningProfileLinks = () => {
  const { data } = useQuery(learningProfilesQuery());

  return (
    <div className="prose text-foreground">
      <h2 className="my-1 text-xl text-foreground">
        Learning Profiles:
      </h2>
      <div className="flex flex-wrap gap-4">
        {map(data, (link) => {
          return (
            <Link
              isExternal
              href={link.url}
              key={link.url}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
