import { project, projects } from "./projects-resolvers.ts";

export const resolvers = {
  Query: {
    project,
    projects,
  },
};
