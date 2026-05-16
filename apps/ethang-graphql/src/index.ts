import { ApolloGateway } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import isNil from "lodash/isNil.js";

// @ts-expect-error imported as string
import supergraphSdl from "./supergraph.graphql";

export type ServerContext = object;

let handler: ReturnType<
  typeof startServerAndCreateCloudflareWorkersHandler<Env, ServerContext>
>;

export default {
  async fetch(request, environment, context) {
    if (isNil(handler)) {
      const gateway = new ApolloGateway({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        supergraphSdl: supergraphSdl as string
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
          context: () => {
            return {} satisfies ServerContext;
          }
        }
      );
    }

    return handler(request, environment, context);
  }
} satisfies ExportedHandler<Env>;
