import { courses } from "./courses-resolvers.ts";
import { knowledgeArea, knowledgeAreas } from "./knowledge-area-resolvers.ts";
import { path, paths } from "./paths-resolvers.ts";
import { project, projects } from "./projects-resolvers.ts";

export const resolvers = {
  Query: {
    courses,
    knowledgeArea,
    knowledgeAreas,
    path,
    paths,
    project,
    projects,
  },
};
