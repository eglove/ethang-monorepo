import { buildSubgraphSchema } from "@apollo/subgraph";
import { drizzle } from "drizzle-orm/d1";
import { gql } from "graphql-tag";

// eslint-disable-next-line sonar/no-wildcard-import
import * as databaseSchema from "../db/schema.ts";
import { createResolvers } from "./resolvers.ts";

const typeDefs = gql`
  directive @shareable on FIELD_DEFINITION | OBJECT

  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.0"
      import: ["@key", "@shareable"]
    )

  type Query {
    feedArticles(
      feedId: String!
      first: Int
      after: String
      isRead: Boolean
    ): ArticleConnection!
    subscriptions(first: Int, after: String): FeedConnection!
  }

  type Mutation {
    addSubscription(
      title: String!
      website: String!
      xmlAddress: String!
    ): Feed!
    markArticleRead(articleId: ID!, isRead: Boolean!): Article!
  }

  type Feed @key(fields: "id") {
    id: ID!
    lastFetchedAt: String
    title: String!
    website: String!
    xmlAddress: String!
    articles(first: Int, after: String, isRead: Boolean): ArticleConnection!
  }

  type Article @key(fields: "id") {
    id: ID!
    content: String
    feedId: String!
    guid: String!
    isRead: Boolean!
    link: String!
    publishedAt: String
    title: String!
  }

  type ArticleConnection {
    edges: [ArticleEdge!]!
    pageInfo: PageInfo!
  }

  type FeedConnection {
    edges: [FeedEdge!]!
    pageInfo: PageInfo!
  }

  type ArticleEdge {
    cursor: String!
    node: Article!
  }

  type FeedEdge {
    cursor: String!
    node: Feed!
  }

  type PageInfo @shareable {
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
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
