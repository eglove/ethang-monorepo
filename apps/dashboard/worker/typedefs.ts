export const typeDefs = `#graphql
scalar Date

type Pagination {
    limit: Int!
    page: Int!
    total: Int!
    totalPages: Int!
}

type Application {
    id: String!
    userId: String!
    applied: Date!
    company: String!
    title: String!
    url: String!
    jobBoardUrl: String
    rejected: Date
    dmUrl: String
    dmSent: Date
}

type QuestionAnswer {
    id: String!
    userId: String!
    answer: String!
    question: String!
}

type ApplicationResponse {
    applications: [Application]!
    pagination: Pagination!
}

type Bookmark {
    id: String!
    title: String!
    url: String!
    userId: String!
}

type Contact {
    id: String!
    userId: String!
    name: String!
    phone: String
    email: String
    linkedIn: String
    lastContact: Date!
    expectedNextContact: Date
}

type Query {
    applications(page: Int = 1, limit: Int = 10, search: String): ApplicationResponse!
    bookmarks: [Bookmark]!
    contacts: [Contact]!
    questionAnswers: [QuestionAnswer]!
}
`;
