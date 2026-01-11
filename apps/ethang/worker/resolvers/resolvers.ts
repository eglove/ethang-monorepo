import { authenticated } from "../auth.ts";
import {
  course,
  courses,
  createCourse,
  deleteCourse,
  updateCourse,
} from "./courses-resolvers.ts";
import {
  createKnowledgeArea,
  deleteKnowledgeArea,
  knowledgeArea,
  knowledgeAreas,
  updateKnowledgeArea,
} from "./knowledge-area-resolvers.ts";
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
    createKnowledgeArea: authenticated(createKnowledgeArea),
    createPath: authenticated(createPath),
    createProject: authenticated(createProject),
    deleteCourse: authenticated(deleteCourse),
    deleteKnowledgeArea: authenticated(deleteKnowledgeArea),
    deletePath: authenticated(deletePath),
    deleteProject: authenticated(deleteProject),
    updateCourse: authenticated(updateCourse),
    updateKnowledgeArea: authenticated(updateKnowledgeArea),
    updatePath: authenticated(updatePath),
    updateProject: authenticated(updateProject),
  },
  Query: {
    course,
    courses,
    knowledgeArea,
    knowledgeAreas,
    path,
    paths,
    project,
    projects,
  },
};
