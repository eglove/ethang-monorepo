import { useQuery } from "@apollo/client/react";
import { Button, Link, Spinner } from "@heroui/react";
import get from "lodash/get.js";
import isArray from "lodash/isArray.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";

import { type GetProjectIds, getProjectIds } from "../../graphql/projects.ts";
import { GithubIcon } from "../svg/github-icon.tsx";
import { TypographyH1 } from "../typography/typography-h1.tsx";
import { ProjectCard } from "./project-card.tsx";

export const ProjectSummary = () => {
  const { data, loading } = useQuery<GetProjectIds>(getProjectIds, {
    variables: {
      where: {
        title: {
          in: ["@ethang/store", "@ethang/eslint-config", "@ethang/toolbelt"],
        },
      },
    },
  });

  const projects = get(data, ["projects"]);

  return (
    <div className="grid gap-4">
      <TypographyH1 className="flex items-center gap-2">
        <GithubIcon /> Projects
      </TypographyH1>
      {loading && <Spinner />}
      {!loading && isArray(projects) && (
        <div className="grid gap-4 sm:grid-cols-3">
          {map(projects, (project) => {
            const id = get(project, ["id"]);

            if (isString(id)) {
              return <ProjectCard id={id} key={id} />;
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
