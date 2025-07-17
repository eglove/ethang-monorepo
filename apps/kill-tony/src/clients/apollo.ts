import { ApolloClient, InMemoryCache } from "@apollo/client";

const cache = new InMemoryCache({
  addTypename: true,
  typePolicies: {
    Appearance: {
      keyFields: ["name"],
    },
    Episode: {
      keyFields: ["number"],
    },
  },
});

export const apolloClient = new ApolloClient({
  cache,
  defaultOptions: {
    query: {
      fetchPolicy: "cache-first",
    },
  },
  uri: "/graphql",
});
