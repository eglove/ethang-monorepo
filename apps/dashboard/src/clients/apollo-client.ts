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
    },
  }),
  uri: "/graphql",
});
