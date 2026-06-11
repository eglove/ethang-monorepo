import { ApolloClient, InMemoryCache } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { LocalStorageWrapper, persistCache } from "apollo3-cache-persist";

const link = new BatchHttpLink({
  batchInterval: 300,
  batchMax: 100,
  uri: "/api/graphql"
});

const cache = new InMemoryCache();

await persistCache({
  cache,
  storage: new LocalStorageWrapper(globalThis.localStorage)
});

export const apolloClient = new ApolloClient({
  cache,
  defaultOptions: {
    query: {
      fetchPolicy: "cache-first"
    }
  },
  link
});
