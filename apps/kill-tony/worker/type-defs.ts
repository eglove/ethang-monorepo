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
        guests: [Appearance]!
        regulars: [Appearance]!
        goldenTicketCashIns: [Appearance]!
        bucketPulls: [Appearance]!
    }
    
    type Appearance {
        id: ID!
        name: String!
        isHallOfFame: Boolean!
        guestsIn: [Episode]!
        regularsIn: [Episode]!
        cashedGoldenTicketIn: [Episode]!
        bucketPullsIn: [Episode]!
    }
    
    input AppearanceInput {
        name: String!
        isHallOfFame: Boolean!
    }
    
    input CreateEpisodeInput {
        number: Int!
        title: String!
        url: String!
        publishDate: DateTime!
    }
    
    input AddAppearanceToEpisodeInput {
        number: Int!
        name: String!
        isGuest: Boolean
        isRegular: Boolean
        isGoldenTicketCashIn: Boolean
        isBucketPull: Boolean
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
