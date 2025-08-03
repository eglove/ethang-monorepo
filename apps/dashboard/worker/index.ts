import { ApolloServer } from "@apollo/server";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import type { Context } from "./types.ts";

import { getPrismaClient } from "./prisma-client.ts";
import { rootResolver } from "./resolvers/root-resolver.ts";
import { typeDefs } from "./typedefs.ts";
import { getIsAuthenticated } from "./utilities/get-is-authenticated.ts";

const server = new ApolloServer<Context>({
  resolvers: rootResolver,
  typeDefs,
});

// @ts-expect-error adding context types
const handler = startServerAndCreateCloudflareWorkersHandler<Env>(server, {
  context: async ({ env, request }) => {
    const userId = await getIsAuthenticated(request);

    if (false === userId) {
      return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
    }

    const prisma = getPrismaClient(env);

    return { env, prisma, request, userId };
  },
});

export default {
  async fetch(request, environment, context) {
    const url = new URL(request.url);

    if ("/graphql" === url.pathname) {
      return handler(request, environment, context);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
