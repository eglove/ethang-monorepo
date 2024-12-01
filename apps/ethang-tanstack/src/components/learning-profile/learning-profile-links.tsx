import { ContentHandler } from "@/components/common/content-handler.tsx";
import { convexQuery } from "@convex-dev/react-query";
import { TypographyH2 } from "@ethang/react-components/src/components/typography/typography-h2.tsx";
import { TypographyLink } from "@ethang/react-components/src/components/typography/typography-link.tsx";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map.js";

import { api } from "../../../convex/_generated/api";

export const LearningProfileLinks = () => {
  // @ts-expect-error beta
  const query = useQuery(convexQuery(api.learningProfile.getAll, {}));

  return (
    <div>
      <TypographyH2 className="text-foreground my-1 text-xl">
        Learning Profiles:
      </TypographyH2>
      <div className="flex flex-wrap gap-4">
        <ContentHandler
          error={query.error}
          isError={query.isError}
          isLoading={query.isPending}
        >
          {map(query.data, (link) => {
            return (
              <TypographyLink
                href={link.url}
                key={link.url}
              >
                {link.name}
              </TypographyLink>
            );
          })}
        </ContentHandler>
      </div>
    </div>
  );
};
