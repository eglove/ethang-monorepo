import { buildSchema } from "drizzle-graphql";
import { drizzle } from "drizzle-orm/d1";
import { GraphQLObjectType, GraphQLSchema } from "graphql/type";

// eslint-disable-next-line sonar/no-wildcard-import
import * as databaseSchema from "../db/schema.ts";
import { subscriptions } from "./query/subscriptions.ts";

export const createSchema = (environment: Env) => {
  const database = drizzle(environment.ethang_rss, {
    schema: databaseSchema
  });

  const { entities } = buildSchema(database);

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      fields: {
        subscriptions: subscriptions(database, entities)
      },
      name: "Query"
    })
  });
};
