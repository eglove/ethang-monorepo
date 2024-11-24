import { TypographyH2 } from "@/components/typography/typography-h2.tsx";
import { TypographyLink } from "@/components/typography/typography-link.tsx";
import { learningProfilesQuery } from "@/query/learning-profiles.ts";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map.js";

export const LearningProfileLinks = () => {
  const { data } = useQuery(learningProfilesQuery());

  return (
    <div>
      <TypographyH2 className="text-foreground my-1 text-xl">
        Learning Profiles:
      </TypographyH2>
      <div className="flex flex-wrap gap-4">
        {map(data, (link) => {
          return (
            <TypographyLink
              href={link.url}
              key={link.url}
            >
              {link.name}
            </TypographyLink>
          );
        })}
      </div>
    </div>
  );
};
