import { buildSubgraphSchema } from "@apollo/subgraph";
import { drizzle } from "drizzle-orm/d1";
import { gql } from "graphql-tag";

import { courseTrackingTable } from "../db/schema.ts";
import { createResolvers } from "./resolvers.ts";

const databaseSchema = {
  courseTrackingTable
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
