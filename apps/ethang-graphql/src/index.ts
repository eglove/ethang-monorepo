import { ApolloGateway } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import isNil from "lodash/isNil.js";

import supergraphSdl from "../public/supergraph.graphql" with { type: "text" };
import { authenticate, type User } from "./authenticate.ts";
import { buildService } from "./build-service.ts";

export type ServerContext = {
  token?: string | undefined;
  user?: User;
};

const handlerStore = {
  handler: undefined as
    | ReturnType<
        typeof startServerAndCreateCloudflareWorkersHandler<Env, ServerContext>
      >
    | undefined
};

const getHandler = (environment: Env) => {
  if (isNil(handlerStore.handler)) {
    const gateway = new ApolloGateway({
      buildService: buildService(environment),
      supergraphSdl
    });

    const server = new ApolloServer<ServerContext>({
      allowBatchedHttpRequests: true,
      gateway,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ footer: false })]
    });

    handlerStore.handler = startServerAndCreateCloudflareWorkersHandler<
      Env,
      ServerContext
    >(
      // @ts-expect-error allow server type mismatch
      server,
      {
        context: async ({ request: _request }) => {
          const user = await authenticate(_request);
          const token = _request.headers.get("X-Token") ?? undefined;
          return { token, user } satisfies ServerContext;
        }
      }
    );
  }

  return handlerStore.handler;
};

export default {
  async fetch(request, environment, context) {
    const currentHandler = getHandler(environment);
    // @ts-expect-error mismatched workers types
    return currentHandler(request, environment, context);
  }
} satisfies ExportedHandler<Env>;
