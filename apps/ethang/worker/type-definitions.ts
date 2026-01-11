export const typeDefs = `#graphql
enum CacheControlScope {
    PUBLIC
    PRIVATE
}

directive @cacheControl(
    maxAge: Int
    scope: CacheControlScope
    inheritMaxAge: Boolean
) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION

type Project @cacheControl(maxAge: 3600) {
    id: String
    code: String
    description: String
    title: String
    publicUrl: String
    techs: [Tech]
}

type Tech @cacheControl(maxAge: 3600) {
    id: String
    name: String
    projects: [Project]
}

input ProjectWhereInput {
    title: StringFilter
}

input StringFilter {
    in: [String]
}

type Course @cacheControl(maxAge: 3600) {
    id: String
    name: String
    author: String
    url: String
    order: Int
    path: Path
}

type Path @cacheControl(maxAge: 3600) {
    id: String
    name: String
    url: String
    order: Int
    courses: [Course]
    _count: PathCount
}

type PathCount {
    courses: Int
}

type Query {
    course(id: String!): Course @cacheControl(maxAge: 3600)
    courses: [Course] @cacheControl(maxAge: 3600)
    path(id: String!): Path @cacheControl(maxAge: 3600)
    paths: [Path] @cacheControl(maxAge: 3600)
    project(id: String!): Project @cacheControl(maxAge: 3600)
    projects(skip: Int, take: Int, where: ProjectWhereInput): [Project] @cacheControl(maxAge: 3600)
}

input CreateProjectInput {
    code: String!
    description: String!
    title: String!
    publicUrl: String
}

input UpdateProjectInput {
    code: String
    description: String
    title: String
    publicUrl: String
}

input CreateCourseInput {
    name: String!
    author: String!
    url: String!
    order: Int!
    pathId: String!
}

input UpdateCourseInput {
    name: String
    author: String
    url: String
    order: Int
    pathId: String
}

input CreatePathInput {
    name: String!
    url: String
    order: Int!
}

input UpdatePathInput {
    name: String
    url: String
    order: Int
}

type Mutation {
    createProject(data: CreateProjectInput!): Project
    updateProject(id: String!, data: UpdateProjectInput!): Project
    deleteProject(id: String!): Project

    createCourse(data: CreateCourseInput!): Course
    updateCourse(id: String!, data: UpdateCourseInput!): Course
    deleteCourse(id: String!): Course

    createPath(data: CreatePathInput!): Path
    updatePath(id: String!, data: UpdatePathInput!): Path
    deletePath(id: String!): Path
}
`;
