import { Link } from "@heroui/react";
import map from "lodash/map.js";

import { MainLayout } from "../components/main-layout.tsx";
import { ProjectCard } from "../components/projects/project-card.tsx";
import { projectList } from "../components/projects/project-list.ts";
import { GithubIcon } from "../components/svg/github-icon.tsx";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";

const RouteComponent = () => {
  return (
    <MainLayout>
      <div className="grid gap-2">
        <TypographyH1 className="text-center">My Projects</TypographyH1>
        <p className="text-center text-foreground-500">
          A collection of my open-source projects, experiments, and
          applications.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 my-8">
        {map(projectList, (project) => {
          return <ProjectCard project={project} />;
        })}
      </div>
      <div className="items-center flex gap-2 justify-center text-foreground-500">
        <GithubIcon />
        Find more of my work on{" "}
        <Link
          isExternal
          className="text-center text-foreground-500"
          href="https://github.com/eglove/ethang-monorepo"
          underline="always"
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
