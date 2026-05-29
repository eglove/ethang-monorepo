import type DataLoader from "dataloader";

import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import { drizzle } from "drizzle-orm/d1";
import isNil from "lodash/isNil.js";

// eslint-disable-next-line sonar/no-wildcard-import
import * as databaseSchema from "./db/schema.ts";
import { createArticleLoader } from "./graphql/data-loader/article-loader.ts";
import { createFeedLoader } from "./graphql/data-loader/feed-loader.ts";
import { createSchema } from "./graphql/schema.ts";
import { depthLimit } from "./graphql/util/depth-limit.ts";

export type ServerContext = {
  articleLoader: DataLoader<string, Article | null>;
  feedLoader: DataLoader<string, Feed | null>;
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

type Article = typeof databaseSchema.articlesTable.$inferSelect;

type Feed = typeof databaseSchema.feedsTable.$inferSelect;

let handler: ReturnType<
  typeof startServerAndCreateCloudflareWorkersHandler<Env, ServerContext>
>;

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
          context: ({ request: _request }) => {
            const userHeader = _request.headers.get("x-user");

            if (isNil(userHeader)) {
              throw new Error("Unauthorized");
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const user = JSON.parse(userHeader) as User;

            const database = drizzle(environment.ethang_rss, {
              schema: databaseSchema
            });

            return {
              articleLoader: createArticleLoader(database),
              feedLoader: createFeedLoader(database),
              user
            } satisfies ServerContext;
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
