import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import startsWith from "lodash/startsWith.js";

import { rootResolver } from "./resolvers/root-resolver.ts";
import { typeDefs } from "./type-defs.ts";

const server = new ApolloServer({
  plugins: [ApolloServerPluginLandingPageLocalDefault()],
  resolvers: rootResolver,
  typeDefs,
});

// @ts-expect-error seems ok
const handler = startServerAndCreateCloudflareWorkersHandler(server, {
  context: ({ ctx, env, request }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return { ctx, env, request } as {
      ctx: typeof ctx;
      env: Env;
      request: typeof request;
    };
  },
});

export default {
  async fetch(request, environment, context) {
    const url = new URL(request.url);

    if (startsWith(url.pathname, "/graphql")) {
      if ("OPTIONS" === request.method) {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      const response = await handler(request, environment, context);
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
