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
    createCourse,
    createKnowledgeArea,
    createPath,
    createProject,
    deleteCourse,
    deleteKnowledgeArea,
    deletePath,
    deleteProject,
    updateCourse,
    updateKnowledgeArea,
    updatePath,
    updateProject,
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
