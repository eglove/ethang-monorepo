import { ApolloClient, InMemoryCache } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { SetContextLink } from "@apollo/client/link/context";
import { LocalStorageWrapper, persistCache } from "apollo3-cache-persist";
import attempt from "lodash/attempt.js";
import isFunction from "lodash/isFunction.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";

const authLink = new SetContextLink(
  // @ts-expect-error for now
  (previousContext: { headers?: Record<string, string> }) => {
    const headers = previousContext.headers ?? {};
    const storedUser = localStorage.getItem("ethang-user");
    let token = "";

    if (!isNil(storedUser)) {
      attempt(() => {
        const parsed: unknown = JSON.parse(storedUser);
        if (isObject(parsed) && !isNil(parsed) && "sessionToken" in parsed) {
          const { sessionToken } = parsed as Record<string, unknown>;

          if (isString(sessionToken)) {
            token = sessionToken;
          }
        }
      });
    }

    return {
      headers: {
        ...headers,
        ...(token ? { "X-Token": token } : {})
      }
    };
  }
);

const httpLink = new BatchHttpLink({
  batchInterval: 300,
  batchMax: 100,
  uri: "/api/graphql"
});

// eslint-disable-next-line unicorn/prefer-spread
const link = authLink.concat(httpLink);

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

if (isFunction(globalThis.addEventListener)) {
  globalThis.addEventListener("focus", () => {
    apolloClient
      .refetchQueries({ include: "active" })
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error("Failed to refetch queries on refocus:", error);
      });
  });
}
