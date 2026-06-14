import { ApolloClient, InMemoryCache } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { SetContextLink } from "@apollo/client/link/context";
import { LoggerClient } from "@ethang/logger-sdk";
import { LocalStorageWrapper, persistCache } from "apollo3-cache-persist";
import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";
import isFunction from "lodash/isFunction.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";
import isUndefined from "lodash/isUndefined.js";
import convertToString from "lodash/toString.js";

const isUndefinedFunction = isUndefined as (
  value: unknown
) => value is undefined;
const isErrorFunction = isError as (value: unknown) => value is Error;

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

const environment = isUndefinedFunction(import.meta.env)
  ? "development"
  : import.meta.env.MODE;

const logger = new LoggerClient({
  apiKey: convertToString(import.meta.env["LOGGER_CLIENT_API_KEY"]),
  environment,
  serviceName: "ethang-react"
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
        const errorStack = isErrorFunction(error) ? error.stack : String(error);

        logger.error(
          "Failed to refetch queries on refocus",
          undefined,
          errorStack
        );
      });
  });
}
