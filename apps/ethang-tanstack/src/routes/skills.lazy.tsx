import { TypographyH1 } from "@/components/typography/typography-h1.tsx";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import map from "lodash/map";
import { LoaderCircle } from "lucide-react";

import { SkillGauge } from "../components/common/skill-gauge.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { experienceQuery } from "../query/experience.ts";

const RouteComponent = () => {
  const { data, isPending } = useQuery(experienceQuery());

  return (
    <MainLayout>
      <TypographyH1 className="my-4 font-bold">
        Years Experience
      </TypographyH1>
      {isPending && <LoaderCircle className="mx-auto my-4 w-full animate-spin" />}
      {!isPending && (
        <div className="mx-auto flex flex-wrap items-center justify-center gap-4">
          {map(data?.skills, ({ experience, name }) => {
            return (
              <SkillGauge
                key={name}
                label={name}
                maxYears={Number(data?.max ?? 0)}
                years={Number(Number(experience).toFixed(2))}
              />
            );
          })}
        </div>
      )}
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/skills")({
  component: RouteComponent,
});
