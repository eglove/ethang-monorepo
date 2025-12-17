import { Link, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map.js";

import { MainLayout } from "../components/main-layout.tsx";
import { ProjectCard } from "../components/projects/project-card.tsx";
import { projectStore } from "../components/projects/project-store.ts";
import { GithubIcon } from "../components/svg/github-icon.tsx";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";

const RouteComponent = () => {
  const { data, isPending } = useQuery(projectStore.getProjects());

  return (
    <MainLayout>
      <div className="grid gap-2">
        <TypographyH1 className="text-center">My Projects</TypographyH1>
        <p className="text-center text-foreground-500">
          A collection of my open-source projects, experiments, and
          applications.
        </p>
      </div>
      {isPending && (
        <div className="my-8 w-full text-center">
          <Spinner />
        </div>
      )}
      {!isPending && (
        <div className="my-8 grid gap-4 sm:grid-cols-3">
          {map(data?.projects, (project) => {
            return <ProjectCard id={project.id} key={project.id} />;
          })}
        </div>
      )}
      <div className="flex items-center justify-center gap-2 text-foreground-500">
        <GithubIcon />
        Find more of my work on{" "}
        <Link
          isExternal
          underline="always"
          className="text-center text-foreground-500"
          href="https://github.com/eglove/ethang-monorepo"
        >
          GitHub
        </Link>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
