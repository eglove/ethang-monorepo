import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache
} from "@apollo/client";

const link = ApolloLink.from([new HttpLink({ uri: "/api/graphql" })]);

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "cache-first"
    }
  },
  link
});
