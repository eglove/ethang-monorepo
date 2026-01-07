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

input CourseWhereInput {
    knowledgeAreas: KnowledgeAreaListRelationFilter
}

input KnowledgeAreaListRelationFilter {
    some: KnowledgeAreaWhereInput
}

input KnowledgeAreaWhereInput {
    id: StringFilter
}

type Course @cacheControl(maxAge: 3600) {
    id: String
    name: String
    author: String
    url: String
    order: Int
    path: Path
    knowledgeAreas: [KnowledgeArea]
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

type KnowledgeArea @cacheControl(maxAge: 3600) {
    id: String
    name: String
    order: Int
    courses: [Course]
    courseCount: Int
}

type Query {
    course(id: String!): Course @cacheControl(maxAge: 3600)
    courses(where: CourseWhereInput): [Course] @cacheControl(maxAge: 3600)
    knowledgeArea(id: String!): KnowledgeArea @cacheControl(maxAge: 3600)
    knowledgeAreas: [KnowledgeArea] @cacheControl(maxAge: 3600)
    path(id: String!): Path @cacheControl(maxAge: 3600)
    paths: [Path] @cacheControl(maxAge: 3600)
    project(id: String!): Project @cacheControl(maxAge: 3600)
    projects(skip: Int, take: Int, where: ProjectWhereInput): [Project] @cacheControl(maxAge: 3600)
}
`;
