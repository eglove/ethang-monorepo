import { ApolloServer, type BaseContext } from "@apollo/server";
import ApolloServerPluginResponseCache from "@apollo/server-plugin-response-cache";
import {
  type CloudflareWorkersHandler,
  startServerAndCreateCloudflareWorkersHandler,
} from "@as-integrations/cloudflare-workers";
import isNil from "lodash/isNil.js";
import startsWith from "lodash/startsWith.js";

import { resolvers } from "./resolvers/resolvers.ts";
import { typeDefs } from "./type-definitions.ts";

const server = new ApolloServer<BaseContext>({
  introspection: true,
  plugins: [ApolloServerPluginResponseCache()],
  resolvers,
  typeDefs,
});

let apolloServer: CloudflareWorkersHandler<Env>;

export default {
  async fetch(request, environment, context) {
    const url = new URL(request.url);

    if (startsWith(url.pathname, "/blog")) {
      return environment.ASSETS.fetch(request);
    }

    if (startsWith(url.pathname, "/graphql")) {
      if (isNil(apolloServer)) {
        apolloServer = startServerAndCreateCloudflareWorkersHandler(server, {
          // @ts-expect-error doesn't need to be promise
          context: (_context) => {
            return _context;
          },
        });
      }

      return apolloServer(request, environment, context);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
