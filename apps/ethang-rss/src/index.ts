import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import isNil from "lodash/isNil.js";

import { createSchema } from "./graphql/schema.ts";

export type ServerContext = {
  user: User;
};

export type User = {
  email: string;
  exp: number;
  iat: number;
  role?: string;
  sub: string;
  username: string;
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
          context: ({ request: _request }) => {
            const userHeader = _request.headers.get("x-user");

            if (isNil(userHeader)) {
              throw new Error("Unauthorized");
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const user = JSON.parse(userHeader) as User;

            return { user } satisfies ServerContext;
          }
        }
      );
    }

    return handler(request, environment, context);
  },
  async scheduled(_event, environment) {
    try {
      await environment.FETCH_FEEDS_WORKFLOW.create({
        id: "fetch-feeds-workflow"
      });
    } catch {
      globalThis.console.log(
        "Sync already in progress, skipping this interval."
      );
    }
  }
} satisfies ExportedHandler<Env>;

export { FetchFeedsWorkflow } from "./cron/fetch-feeds-workflow.ts";
