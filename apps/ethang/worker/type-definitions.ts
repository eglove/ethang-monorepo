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

  type ProjectConnection {
    projects: [Project]
    total: Int
  }

  input ProjectWhereInput {
    title: StringFilter
  }

  input StringFilter {
    in: [String]
  }

  type Query {
    project(id: String!): Project
    projects(skip: Int, take: Int, where: ProjectWhereInput): ProjectConnection
  }
`;
