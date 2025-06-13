import { Button, Link, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map.js";

import { GithubIcon } from "../svg/github-icon.tsx";
import { TypographyH1 } from "../typography/typography-h1.tsx";
import { ProjectCard } from "./project-card.tsx";
import { projectStore } from "./project-store.ts";

export const ProjectSummary = () => {
  const { data, isPending } = useQuery(projectStore.getProjects(1, 3));

  return (
    <div className="grid gap-4">
      <TypographyH1 className="flex items-center gap-2">
        <GithubIcon /> Projects
      </TypographyH1>
      {isPending && <Spinner />}
      {!isPending && (
        <div className="grid sm:grid-cols-3 gap-4">
          {map(data?.projects, (project) => {
            return <ProjectCard id={project.id} key={project.id} />;
          })}
        </div>
      )}
      <Button
        as={Link}
        className="bg-black text-white border-1 border-white"
        href="/projects"
      >
        View All Projects
      </Button>
    </div>
  );
};
