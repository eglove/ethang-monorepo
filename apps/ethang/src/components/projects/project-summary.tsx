import { Button, Link } from "@heroui/react";
import map from "lodash/map.js";
import slice from "lodash/slice.js";

import { GithubIcon } from "../svg/github-icon.tsx";
import { TypographyH1 } from "../typography/typography-h1.tsx";
import { ProjectCard } from "./project-card.tsx";
import { projectList } from "./project-list.ts";

export const ProjectSummary = () => {
  return (
    <div className="grid gap-4">
      <TypographyH1 className="flex items-center gap-2">
        <GithubIcon /> Projects
      </TypographyH1>
      <div className="grid sm:grid-cols-3 gap-4">
        {map(slice(projectList, 0, 3), (project) => {
          return <ProjectCard project={project} />;
        })}
      </div>
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
