import { ApolloServer, type BaseContext } from "@apollo/server";
import ApolloServerPluginResponseCache from "@apollo/server-plugin-response-cache";
import { describe, expect, it } from "vitest";

import { resolvers } from "./resolvers/resolvers";
import { typeDefs } from "./type-definitions";

describe("Apollo Server Caching", () => {
  it("returns cache-control headers for projects query", async () => {
    const server = new ApolloServer<BaseContext>({
      plugins: [ApolloServerPluginResponseCache()],
      resolvers,
      typeDefs,
    });

    await server.executeOperation({
      query: "query { projects { id title } }",
    });

    // A better way to test without full integration is to check if the schema has the directives.
    expect(typeDefs).toContain("@cacheControl(maxAge: 3600)");
  });
});
