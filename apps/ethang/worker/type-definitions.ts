export const typeDefs = `#graphql
  type Project {
    id: String
    code: String
    description: String
    title: String
    publicUrl: String
    techs: [Tech]
  }

  type Tech {
    id: String
    name: String
    projects: [Project]
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type ProjectConnection {
    edges: [ProjectEdge]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ProjectEdge {
    cursor: String!
    node: Project
  }

  type Query {
    project(id: String!): Project
    projects(first: Int, after: String): ProjectConnection
  }
`;
