import { buildSchema } from "drizzle-graphql";
import { drizzle } from "drizzle-orm/d1";
import { GraphQLObjectType, GraphQLSchema } from "graphql/type";

// eslint-disable-next-line sonar/no-wildcard-import
import * as databaseSchema from "../db/schema.ts";
import { addSubscription } from "./mutations/add-subscription.ts";
import { subscriptions } from "./queries/subscriptions.ts";

export const createSchema = (environment: Env) => {
  const database = drizzle(environment.ethang_rss, {
    schema: databaseSchema
  });

  const { entities } = buildSchema(database);

  return new GraphQLSchema({
    mutation: new GraphQLObjectType({
      fields: {
        addSubscription: addSubscription(database, entities)
      },
      name: "Mutation"
    }),
    query: new GraphQLObjectType({
      fields: {
        subscriptions: subscriptions(database, entities)
      },
      name: "Query"
    })
  });
};
