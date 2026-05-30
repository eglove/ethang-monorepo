import { buildSubgraphSchema } from "@apollo/subgraph";
import { drizzle } from "drizzle-orm/d1";
import { gql } from "graphql-tag";

import {
  coursesTable,
  courseTrackingTable,
  learningPathCoursesTable,
  learningPathsTable
} from "../db/schema.ts";
import { createResolvers } from "./resolvers.ts";

const databaseSchema = {
  coursesTable,
  courseTrackingTable,
  learningPathCoursesTable,
  learningPathsTable
};

export type DatabaseBinding = Parameters<typeof drizzle>[0];

const typeDefs = gql`
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.0"
      import: ["@shareable"]
    )

  type Query {
    courseTracking(courseId: String!, userId: String!): CourseTracking
    courseTrackings(
      userId: String!
      first: Int
      after: String
    ): CourseTrackingConnection!
    courses: [Course!]!
    course(id: ID!): Course
    learningPaths: [LearningPath!]!
    learningPath(id: ID!): LearningPath
  }

  type Mutation {
    cycleCourseTrackingStatus(
      courseId: String!
      userId: String!
    ): CourseTracking
  }

  type CourseTracking @shareable {
    courseUrl: String!
    id: ID!
    status: String!
    userId: String!
  }

  type Course @shareable {
    id: ID!
    name: String!
    author: String!
    url: String!
    createdAt: String!
    updatedAt: String!
  }

  type LearningPath @shareable {
    id: ID!
    name: String!
    url: String
    swebokFocus: String!
    courses: [Course!]!
    createdAt: String!
    updatedAt: String!
  }

  type CourseTrackingConnection {
    edges: [CourseTrackingEdge!]!
    pageInfo: PageInfo!
  }

  type CourseTrackingEdge {
    cursor: String!
    node: CourseTracking!
  }

  type PageInfo @shareable {
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
  }
`;

export const createSchema = (databaseBinding: DatabaseBinding) => {
  const database = drizzle(databaseBinding, {
    schema: databaseSchema
  });

  return buildSubgraphSchema({
    resolvers: createResolvers(database),
    typeDefs
  });
};
