import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import isNil from "lodash/isNil.js";

import { authenticate, type User } from "./authenticate.ts";
// @ts-expect-error imported as string
import supergraphSdl from "./supergraph.graphql";

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
        buildService({ name, url }) {
          return new RemoteGraphQLDataSource({
            async fetcher(fetchUrl, init) {
              const parsedUrl = new URL(fetchUrl);
              const requestUrl = `https://${name}${parsedUrl.pathname}${parsedUrl.search}`;
              // @ts-expect-error bypass strict init type check
              const gatewayRequest = new Request(requestUrl, init);

              if ("ethang-rss" === name && !isNil(environment.ethang_rss)) {
                return environment.ethang_rss.fetch(gatewayRequest);
              }

              return fetch(gatewayRequest);
            },
            url: url ?? "",
            willSendRequest({
              context: gatewayContext,
              request: outgoingRequest
            }) {
              const { user } = gatewayContext;
              if (!isNil(user)) {
                outgoingRequest.http?.headers.set(
                  "x-user",
                  JSON.stringify(user)
                );
              }
            }
          });
        },
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
          context: async ({ request: _request }) => {
            if (
              "IntrospectionQuery" ===
              _request.headers.get("x-apollo-operation-name")
            ) {
              return {} satisfies ServerContext;
            }

            try {
              const user = await authenticate(_request);
              return { user } satisfies ServerContext;
            } catch {
              return {} satisfies ServerContext;
            }
          }
        }
      );
    }

    return handler(request, environment, context);
  }
} satisfies ExportedHandler<Env>;
