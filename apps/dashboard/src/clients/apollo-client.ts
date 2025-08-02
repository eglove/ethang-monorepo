import { ApolloClient, from, HttpLink, InMemoryCache } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { addToast } from "@heroui/react";
import isNil from "lodash/isNil.js";

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (!isNil(graphQLErrors)) {
    for (const graphQLError of graphQLErrors) {
      addToast({
        color: "danger",
        description: graphQLError.message,
        title: "Error",
      });
    }
  }

  if (!isNil(networkError)) {
    addToast({
      color: "danger",
      description: networkError.message,
      title: "Error",
    });
  }
});

const httpLink = new HttpLink({
  uri: "/graphql",
});

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
      Todo: {
        keyFields: ["id"],
      },
    },
  }),
  defaultOptions: {
    query: {
      fetchPolicy: "cache-first",
    },
  },
  link: from([errorLink, httpLink]),
  uri: "/graphql",
});
