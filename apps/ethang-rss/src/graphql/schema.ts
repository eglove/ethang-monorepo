import { buildSubgraphSchema } from "@apollo/subgraph";
import { drizzle } from "drizzle-orm/d1";
import { parse } from "graphql";

import { databaseSchema } from "../db/database-schema.ts";
import { createResolvers } from "./resolvers.ts";
import typeDefs from "./schema.graphql";

export const createSchema = (environment: Env) => {
  const database = drizzle(environment.ethang_rss, {
    schema: databaseSchema
  });

  // @ts-expect-error ignore
  return buildSubgraphSchema({
    resolvers: createResolvers(database),
    typeDefs: parse(typeDefs)
  });
};
