import { Spinner } from "@nextui-org/spinner";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import map from "lodash/map";

import { SkillGauge } from "../components/common/skill-gauge";
import { MainLayout } from "../components/layouts/main-layout";
import { experienceQuery } from "../query/experience";

const HomeComponent = () => {
  const { data, isPending } = useQuery(experienceQuery());

  return (
    <MainLayout>
      <h1 className="my-4 text-center text-3xl font-bold">
        Years Experience
      </h1>
      {isPending && <Spinner className="mx-auto my-4 w-full" />}
      {!isPending && (
        <div className="mx-auto grid place-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {map(data?.skills,
            ({ experience, name }) => {
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

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
