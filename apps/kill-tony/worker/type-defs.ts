export const typeDefs = `#graphql
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
    
    scalar DateTime

    type Query {
        episode(number: Int!): Episode
        episodes: [Episode]!
        appearance(name: String!): Appearance
        appearances: [Appearance]!
    }
    
     type Mutation {
        createEpisode(input: CreateEpisodeInput!): Episode!
        createAppearance(input: AppearanceInput!): Appearance!
        addAppearanceToEpisode(input: AddAppearanceToEpisodeInput!): Episode!
    }
`;
