import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";

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
  link: ApolloLink.from([httpLink]),
});
