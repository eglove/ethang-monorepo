import { ApolloClient, InMemoryCache } from "@apollo/client";

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Application: {
        keyFields: ["id"],
      },
      Bookmark: {
        keyFields: ["id"],
      },
      Client: {
        keyFields: ["id"],
      },
      QuestionAnswer: {
        keyFields: ["id"],
      },
    },
  }),
  uri: "/graphql",
});
