import type DataLoader from "dataloader";

import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import { LoggerClient } from "@ethang/logger-sdk";
import { drizzle } from "drizzle-orm/d1";
import includes from "lodash/includes.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import convertToString from "lodash/toString.js";

import { authenticate } from "./authenticate.ts";
// eslint-disable-next-line sonar/no-wildcard-import
import * as databaseSchema from "./db/schema.ts";
import { createArticleLoader } from "./graphql/data-loader/article-loader.ts";
import { createFeedLoader } from "./graphql/data-loader/feed-loader.ts";
import { createUserArticleStateLoader } from "./graphql/data-loader/user-article-state-loader.ts";
import { createSchema } from "./graphql/schema.ts";
import { depthLimit } from "./graphql/util/depth-limit.ts";
import {
  getEnvironmentString,
  getSecretValue
} from "./util/get-environment-secret.ts";

export type ServerContext = {
  articleLoader: DataLoader<string, Article | null>;
  feedLoader: DataLoader<string, Feed | null>;
  user: User;
  userArticleStateLoader: DataLoader<string, null | UserItemState>;
};
export type User = {
  email: string;
  exp: number;
  iat: number;
  role?: string;
  sub: string;
  username: string;
};

type Article = typeof databaseSchema.articlesTable.$inferSelect;

type Feed = typeof databaseSchema.feedsTable.$inferSelect;

type UserItemState = typeof databaseSchema.userItemStatesTable.$inferSelect;

const store = {
  handler: undefined as
    | ReturnType<
        typeof startServerAndCreateCloudflareWorkersHandler<Env, ServerContext>
      >
    | undefined
};

export default {
  async fetch(request, environment, context) {
    if (isNil(store.handler)) {
      const server = new ApolloServer<ServerContext>({
        introspection: true,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ footer: false })],
        schema: createSchema(environment),
        validationRules: [depthLimit(10)]
      });

      store.handler = startServerAndCreateCloudflareWorkersHandler<
        Env,
        ServerContext
      >(
        // @ts-expect-error allow server type mismatch
        server,
        {
          context: async ({ request: _request }) => {
            const user = await authenticate(_request);

            const database = drizzle(environment.ethang_rss, {
              schema: databaseSchema
            });

            return {
              articleLoader: createArticleLoader(database),
              feedLoader: createFeedLoader(database),
              user,
              userArticleStateLoader: createUserArticleStateLoader(
                database,
                user.sub
              )
            } satisfies ServerContext;
          }
        }
      );
    }

    // @ts-expect-error allow context type mismatch
    return store.handler(request, environment, context);
  },
  async scheduled(event, environment) {
    const workflowId = `fetch-feeds-${event.scheduledTime}`;

    try {
      await environment.FETCH_FEEDS_WORKFLOW.create({
        id: workflowId
      });
    } catch (error) {
      const message = isError(error) ? error.message : String(error);

      if (!includes(message, "already exists")) {
        const apiKey = convertToString(
          await getSecretValue(environment.LOGGER_API_KEY)
        );
        const environmentName =
          getEnvironmentString(environment, "ENVIRONMENT") ?? "production";
        const logger = new LoggerClient({
          apiKey,
          environment: environmentName,
          serviceName: "ethang-rss-scheduler"
        });

        logger.error(
          "Failed to start feed sync workflow",
          undefined,
          isError(error) ? error.stack : String(error)
        );
        throw error;
      }
    }
  }
} satisfies ExportedHandler<Env>;

export { FetchFeedsWorkflow } from "./cron/fetch-feeds-workflow.ts";
