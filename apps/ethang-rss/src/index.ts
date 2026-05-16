import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import isNil from "lodash/isNil.js";

import { authenticate, type User } from "./authenticate.ts";
import { createSchema } from "./graphql/schema.ts";

export type ServerContext = {
  user: User;
};

let handler: ReturnType<
  typeof startServerAndCreateCloudflareWorkersHandler<Env, ServerContext>
>;

export default {
  async fetch(request, environment, context) {
    if (isNil(handler)) {
      const server = new ApolloServer<ServerContext>({
        introspection: true,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ footer: false })],
        schema: createSchema(environment)
      });

      handler = startServerAndCreateCloudflareWorkersHandler<
        Env,
        ServerContext
      >(
        // @ts-expect-error allow server type mismatch
        server,
        {
          context: async ({ request: _request }) => {
            const user = await authenticate(request);

            return { user } satisfies ServerContext;
          }
        }
      );
    }

    return handler(request, environment, context);
  },
  async scheduled(_controller, environment, _context) {
    try {
      await environment.FETCH_FEEDS_WORKFLOW.create({
        id: "rss-sync-singleton"
      });
    } catch {
      globalThis.console.log(
        "Sync already in progress, skipping this interval."
      );
    }
  }
} satisfies ExportedHandler<Env>;

export { FetchFeedsWorkflow } from "./cron/fetch-feeds-workflow.ts";
