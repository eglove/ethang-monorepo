export const typeDefs = `#graphql
    enum OrderDirection {
        asc
        desc
    }

    type Episode {
        number: Int!
        title: String!
        url: String!
        publishDate: DateTime!
        appearances: [Appearance]!
    }
    
    type Appearance {
        id: ID!
        name: String!
        isGuest: Boolean!
        isBucketPull: Boolean!
        isRegular: Boolean!
        isHallOfFame: Boolean!
        isGoldenTicketWinner: Boolean!
        episodes: [Episode]!
    }
    
    input AppearanceInput {
        name: String!
        isGuest: Boolean!
        isBucketPull: Boolean!
        isRegular: Boolean!
        isHallOfFame: Boolean!
        isGoldenTicketWinner: Boolean!
    }
    
    input CreateEpisodeInput {
        number: Int!
        title: String!
        url: String!
        publishDate: DateTime!
        appearances: [AppearanceInput!]!
    }
    
    input AddAppearanceToEpisodeInput {
        number: Int!
        appearance: AppearanceInput! 
    }

    input EpisodeWhereInput {
        number: Int!
    }

    input AppearanceWhereInput {
        name: String!
    }

    input EpisodeOrderByInput {
        number: OrderDirection
    }
    
    scalar DateTime

    type Query {
        episode(where: EpisodeWhereInput!): Episode
        episodes(orderBy: EpisodeOrderByInput): [Episode]!
        appearance(where: AppearanceWhereInput!): Appearance
        appearances: [Appearance]!
    }
    
     type Mutation {
        createEpisode(input: CreateEpisodeInput!): Episode!
        createAppearance(input: AppearanceInput!): Appearance!
        addAppearanceToEpisode(input: AddAppearanceToEpisodeInput!): Episode!
    }
`;
