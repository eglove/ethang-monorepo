import { ApolloGateway } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import isNil from "lodash/isNil.js";

import supergraphSdl from "../public/supergraph.graphql" with { type: "text" };
import { authenticate, type User } from "./authenticate.ts";
import { buildService } from "./build-service.ts";

export type ServerContext = {
  user?: User;
};

let handler: ReturnType<
  typeof startServerAndCreateCloudflareWorkersHandler<Env, ServerContext>
>;

export default {
  async fetch(request, environment, context) {
    if (isNil(handler)) {
      const gateway = new ApolloGateway({
        buildService: buildService(environment),
        supergraphSdl
      });

      const server = new ApolloServer<ServerContext>({
        gateway,
        introspection: true,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ footer: false })]
      });

      handler = startServerAndCreateCloudflareWorkersHandler<
        Env,
        ServerContext
      >(
        // @ts-expect-error allow server type mismatch
        server,
        {
          context: async ({ request: _request }) => {
            const user = await authenticate(_request);
            return { user } satisfies ServerContext;
          }
        }
      );
    }

    return handler(request, environment, context);
  }
} satisfies ExportedHandler<Env>;
