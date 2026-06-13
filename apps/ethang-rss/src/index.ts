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

let handler: ReturnType<
  typeof startServerAndCreateCloudflareWorkersHandler<Env, ServerContext>
>;

const getEnvironmentString = (
  object: unknown,
  key: string
): string | undefined => {
  // eslint-disable-next-line lodash/prefer-lodash-typecheck
  if ("object" === typeof object && null !== object && key in object) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const value = (object as Record<string, unknown>)[key];
    // eslint-disable-next-line lodash/prefer-lodash-typecheck
    return "string" === typeof value ? value : undefined;
  }
  return undefined;
};

const getSecretValue = async (secret: unknown): Promise<string | undefined> => {
  if (
    // eslint-disable-next-line lodash/prefer-lodash-typecheck
    "object" === typeof secret &&
    null !== secret &&
    "get" in secret &&
    // eslint-disable-next-line lodash/prefer-lodash-typecheck
    "function" === typeof secret.get
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return await (secret as { get: () => Promise<string> }).get();
    } catch {
      return undefined;
    }
  }
  // eslint-disable-next-line lodash/prefer-lodash-typecheck
  return "string" === typeof secret ? secret : undefined;
};

export default {
  async fetch(request, environment, context) {
    if (isNil(handler)) {
      const server = new ApolloServer<ServerContext>({
        introspection: true,
        plugins: [ApolloServerPluginLandingPageLocalDefault({ footer: false })],
        schema: createSchema(environment),
        validationRules: [depthLimit(10)]
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

    return handler(request, environment, context);
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
