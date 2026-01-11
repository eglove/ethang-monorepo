import { authenticated } from "../auth.ts";
import {
  course,
  courses,
  createCourse,
  deleteCourse,
  updateCourse,
} from "./courses-resolvers.ts";
import {
  createPath,
  deletePath,
  path,
  paths,
  updatePath,
} from "./paths-resolvers.ts";
import {
  createProject,
  deleteProject,
  project,
  projects,
  updateProject,
} from "./projects-resolvers.ts";

export const resolvers = {
  Mutation: {
    createCourse: authenticated(createCourse),
    createPath: authenticated(createPath),
    createProject: authenticated(createProject),
    deleteCourse: authenticated(deleteCourse),
    deletePath: authenticated(deletePath),
    deleteProject: authenticated(deleteProject),
    updateCourse: authenticated(updateCourse),
    updatePath: authenticated(updatePath),
    updateProject: authenticated(updateProject),
  },
  Query: {
    course,
    courses,
    path,
    paths,
    project,
    projects,
  },
};
