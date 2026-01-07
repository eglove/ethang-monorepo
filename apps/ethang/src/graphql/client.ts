import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import get from "lodash/get";
import isString from "lodash/isString";

const toCacheReference = (typename: string) => {
  return (
    _: unknown,
    {
      args,
      toReference,
    }: {
      args: null | Record<string, string>;
      toReference: (properties: Record<string, string>) => unknown;
    },
  ) => {
    const id = get(args, ["id"]);

    if (isString(id)) {
      return toReference({
        __typename: typename,
        id,
      });
    }

    return null;
  };
};

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          course: {
            read: toCacheReference("Course"),
          },
          knowledgeArea: {
            read: toCacheReference("KnowledgeArea"),
          },
          path: {
            read: toCacheReference("Path"),
          },
          project: {
            read: toCacheReference("Project"),
          },
        },
      },
    },
  }),
  link: new HttpLink({
    uri: `${globalThis.location.protocol}/graphql`,
  }),
});
