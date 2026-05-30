import type { ExecutionContext } from "@cloudflare/workers-types";

import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import isNil from "lodash/isNil.js";

import { createSchema, type DatabaseBinding } from "./graphql/schema.ts";

type WorkerEnvironment = {
  ethang_courses: DatabaseBinding;
};

let handler: ReturnType<typeof startServerAndCreateCloudflareWorkersHandler>;

export default {
  async fetch(
    request: Request,
    environment: WorkerEnvironment,
    context: ExecutionContext
  ) {
    if (isNil(handler)) {
      const server = new ApolloServer({
        introspection: true,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ footer: false })],
        schema: createSchema(environment.ethang_courses)
      });

      handler = startServerAndCreateCloudflareWorkersHandler(
        // @ts-expect-error cloudflare worker integration mismatch
        server
      );
    }

    return handler(request, environment, context);
  }
};
