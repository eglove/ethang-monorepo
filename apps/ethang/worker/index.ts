import { ApolloServer, type BaseContext } from "@apollo/server";
import ApolloServerPluginResponseCache from "@apollo/server-plugin-response-cache";
import {
  type CloudflareWorkersHandler,
  startServerAndCreateCloudflareWorkersHandler,
} from "@as-integrations/cloudflare-workers";
import { getCookieValue } from "@ethang/toolbelt/http/cookie";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import startsWith from "lodash/startsWith.js";

import { type AuthUser, verifyToken } from "./auth.ts";
import { resolvers } from "./resolvers/resolvers.ts";
import { typeDefs } from "./type-definitions.ts";

const server = new ApolloServer<BaseContext>({
  introspection: true,
  plugins: [ApolloServerPluginResponseCache()],
  resolvers,
  typeDefs,
});

export type ServerContext = { env: Env; user: AuthUser | undefined };
let apolloServer: CloudflareWorkersHandler<ServerContext>;

export default {
  async fetch(request, environment, context) {
    const url = new URL(request.url);

    if (startsWith(url.pathname, "/graphql")) {
      let user: AuthUser | undefined;

      if (isNil(apolloServer)) {
        apolloServer = startServerAndCreateCloudflareWorkersHandler(server, {
          context: async (_context) => {
            const token = getCookieValue(
              "ethang-auth-token",
              _context.request.headers,
            );

            if (!isError(token)) {
              user = await verifyToken(token);
            }

            return {
              ..._context,
              env: environment,
              user,
            };
          },
        });
      }

      return apolloServer(request, { env: environment, user }, context);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
