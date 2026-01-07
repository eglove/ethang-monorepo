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

  input CourseWhereInput {
    knowledgeAreas: KnowledgeAreaListRelationFilter
  }

  input KnowledgeAreaListRelationFilter {
    some: KnowledgeAreaWhereInput
  }

  input KnowledgeAreaWhereInput {
    id: StringFilter
  }

  type Query {
    courses(where: CourseWhereInput): [Course]
    knowledgeArea(id: String!): KnowledgeArea
    knowledgeAreas: [KnowledgeArea]
    path(id: String!): Path
    paths: [Path]
    project(id: String!): Project
    projects(skip: Int, take: Int, where: ProjectWhereInput): ProjectConnection
  }

  type Course {
    id: String
    name: String
    author: String
    url: String
    order: Int
    path: Path
    knowledgeAreas: [KnowledgeArea]
  }

  type Path {
    id: String
    name: String
    url: String
    order: Int
    courses: [Course]
    courseCount: Int
  }

  type KnowledgeArea {
    id: String
    name: String
    order: Int
    courses: [Course]
    courseCount: Int
  }
`;
