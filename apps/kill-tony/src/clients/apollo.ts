import { ApolloClient, InMemoryCache } from "@apollo/client";
import { persistCache } from "apollo3-cache-persist";
import { del, get, set } from "idb-keyval";
import isNil from "lodash/isNil.js";

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

await persistCache({
  cache,
  storage: {
    getItem: async (key) => {
      const value = await get<string>(key);
      return isNil(value) ? null : value;
    },
    removeItem: async (key) => {
      return del(key);
    },
    setItem: async (key, value) => {
      return set(key, value);
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
