import { buildSubgraphSchema } from "@apollo/subgraph";
import { drizzle } from "drizzle-orm/d1";
import { gql } from "graphql-tag";

// eslint-disable-next-line sonar/no-wildcard-import
import * as databaseSchema from "../db/schema.ts";
import { createResolvers } from "./resolvers.ts";

const typeDefs = gql`
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.0"
      import: ["@key", "@shareable"]
    )

  type Query {
    feedArticles(feedId: String!): [Article!]!
    subscriptions: [Feed!]!
  }

  type Mutation {
    addSubscription(
      title: String!
      website: String!
      xmlAddress: String!
    ): Feed!
  }

  type Feed @key(fields: "id") {
    id: ID!
    lastFetchedAt: String
    title: String!
    website: String!
    xmlAddress: String!
    articles: [Article!]!
  }

  type Article @key(fields: "id") {
    id: ID!
    content: String
    feedId: String!
    guid: String!
    link: String!
    publishedAt: String
    title: String!
  }
`;

export const createSchema = (environment: Env) => {
  const database = drizzle(environment.ethang_rss, {
    schema: databaseSchema
  });

  // @ts-expect-error ignore
  return buildSubgraphSchema({
    resolvers: createResolvers(database),
    typeDefs
  });
};
