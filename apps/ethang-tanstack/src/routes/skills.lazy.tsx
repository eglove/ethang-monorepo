import { ContentHandler } from "@/components/common/content-handler.tsx";
import { SkillGauge } from "@/components/common/skill-gauge.tsx";
import { TypographyH1 } from "@/components/typography/typography-h1.tsx";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map";

import { api } from "../../convex/_generated/api";
import { MainLayout } from "../components/layouts/main-layout.tsx";

const RouteComponent = () => {
  // @ts-expect-error beta
  const experienceQuery = useQuery(convexQuery(api.jobs.getExperience, {}));

  return (
    <MainLayout>
      <TypographyH1 className="my-4 font-bold">
        Years Experience
      </TypographyH1>
      <ContentHandler
        isEmpty={() => {
          return isEmpty(experienceQuery.data);
        }}
        emptyPlaceholder="Nothing found"
        error={experienceQuery.error}
        isError={experienceQuery.isError}
        isLoading={experienceQuery.isPending}
      >
        <div className="mx-auto flex flex-wrap items-center justify-center gap-4">
          {map(get(experienceQuery, ["data", "skills"], []), ({ experience, name }) => {
            return (
              <SkillGauge
                key={name}
                label={name}
                maxYears={Number(experienceQuery.data.max)}
                years={Number(Number(experience).toFixed(2))}
              />
            );
          })}
        </div>
      </ContentHandler>
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/skills")({
  component: RouteComponent,
});
