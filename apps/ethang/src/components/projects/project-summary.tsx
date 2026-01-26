import { Button, Link, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import isArray from "lodash/isArray.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";

import { getTopProjectIds } from "../../sanity/queries.ts";
import { GithubIcon } from "../svg/github-icon.tsx";
import { TypographyH1 } from "../typography/typography-h1.tsx";
import { ProjectCard } from "./project-card.tsx";

export const ProjectSummary = () => {
  const { data, isPending } = useQuery(getTopProjectIds());

  return (
    <div className="grid gap-4">
      <TypographyH1 className="flex items-center gap-2">
        <GithubIcon /> Projects
      </TypographyH1>
      {isPending && <Spinner />}
      {!isPending && isArray(data) && (
        <div className="grid gap-4 sm:grid-cols-3">
          {map(data, (project) => {
            if (isString(project._id)) {
              return <ProjectCard id={project._id} key={project._id} />;
            }

            return null;
          })}
        </div>
      )}
      <Button
        as={Link}
        href="/projects"
        className="border-1 border-white bg-black text-white"
      >
        View All Projects
      </Button>
    </div>
  );
};
