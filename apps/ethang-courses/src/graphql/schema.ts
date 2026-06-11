import { buildSubgraphSchema } from "@apollo/subgraph";
import { drizzle } from "drizzle-orm/d1";
import { parse } from "graphql";

import {
  coursesTable,
  courseTrackingTable,
  curriculumLearningPathsTable,
  curriculumsTable,
  learningPathCoursesTable,
  learningPathsTable
} from "../db/schema.ts";
import { createResolvers } from "./resolvers.ts";
import typeDefs from "./schema.graphql";

const databaseSchema = {
  coursesTable,
  courseTrackingTable,
  curriculumLearningPathsTable,
  curriculumsTable,
  learningPathCoursesTable,
  learningPathsTable
};

export type DatabaseBinding = Parameters<typeof drizzle>[0];

export const createSchema = (databaseBinding: DatabaseBinding) => {
  const database = drizzle(databaseBinding, {
    schema: databaseSchema
  });

  return buildSubgraphSchema({
    resolvers: createResolvers(database),
    typeDefs: parse(typeDefs)
  });
};
