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

type ApplicationResponse {
    applications: [Application]!
    pagination: Pagination!
}

type IdObject {
    id: Int!
}

type ApplicationStatsCompany {
    company: String!
    _count: IdObject
}

type UserDailyApplications {
    date: Date!
    totalApplications: Int!
}

type ApplicationStats {
    averageApplicationsPerDay: Float!
    averageResponseRate: Float!
    averageTimeToRejected: Float!
    topCompanies: [ApplicationStatsCompany]!
    totalApplications: Int!
    totalCompanies: Int!
    userDailyApplications: [UserDailyApplications]!
}

type QuestionAnswer {
    id: String!
    userId: String!
    answer: String!
    question: String!
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

type Todo {
    id: String!
    userId: String!
    title: String!
    description: String
    recurs: Int
    dueDate: Date
}

input CreateApplicationInput {
    applied: Date!
    company: String!
    title: String!
    url: String!
    jobBoardUrl: String
    rejected: Date
    dmUrl: String
    dmSent: Date
}

input DeleteApplicationInput {
    id: String!
}

input UpdateApplicationInput {
    id: String!
    applied: Date!
    company: String!
    title: String!
    url: String!
    jobBoardUrl: String
    rejected: Date
    dmUrl: String
    dmSent: Date
}

type Query {
    applications(page: Int = 1, limit: Int = 10, search: String): ApplicationResponse!
    bookmarks: [Bookmark]!
    contacts: [Contact]!
    questionAnswers: [QuestionAnswer]!
    todos: [Todo]!
    applicationStats: ApplicationStats!
}

type Mutation {
    createApplication(input: CreateApplicationInput!): Application!
    deleteApplication(input: DeleteApplicationInput!): Application!
    updateApplication(input: UpdateApplicationInput!): Application!
}`;
