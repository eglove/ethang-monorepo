import { installCloudflareLogger } from "@ethang/telemetry/logger.ts";
import { fn } from "@ethang/telemetry/spans.ts";
import { createCachedJsonResponse } from "@ethang/toolbelt/cache/cache-control.js";
import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { Effect, pipe } from "effect";
import includes from "lodash/includes.js";

import { UnauthorizedError } from "./authenticate.ts";
import { addSubscriptionMutation } from "./data/mutations/add-subscription.ts";
import { markArticleReadMutation } from "./data/mutations/mark-article-read.ts";
import { removeSubscriptionMutation } from "./data/mutations/remove-subscription.ts";
import { allArticlesQuery } from "./data/queries/all-articles.ts";
import { feedArticlesQuery } from "./data/queries/feed-articles.ts";
import { subscriptionQuery } from "./data/queries/subscription.ts";
import { subscriptionsQuery } from "./data/queries/subscriptions.ts";
// eslint-disable-next-line sonar/no-wildcard-import
import * as databaseSchema from "./db/schema.ts";

// Route Effect logs through console.* so they reach Cloudflare Workers Logs.
installCloudflareLogger();

export type User = {
  email: string;
  exp: number;
  iat: number;
  role?: string;
  sub: string;
  username: string;
};

const createDatabase = (databaseBinding: D1Database) => {
  return drizzle(databaseBinding, {
    schema: databaseSchema
  });
};

const verifySessionToken = (sessionToken: string) => {
  return Effect.gen(function* () {
    const userResponse = yield* Effect.tryPromise({
      catch: () => {
        return new UnauthorizedError({ message: "Unauthorized" });
      },
      try: async () => {
        return globalThis.fetch("https://auth.ethang.dev/verify", {
          headers: { "X-Token": sessionToken }
        });
      }
    });

    if (!userResponse.ok) {
      yield* Effect.fail(new UnauthorizedError({ message: "Unauthorized" }));
    }

    return yield* Effect.tryPromise({
      catch: () => {
        return new UnauthorizedError({ message: "Unauthorized" });
      },
      try: async (): Promise<User> => {
        return userResponse.json();
      }
    });
  });
};

// eslint-disable-next-line unicorn/no-anonymous-default-export
export default class extends WorkerEntrypoint<Env> {
  public async addSubscription(parameters: {
    sessionToken: string;
    xmlAddress: string;
  }) {
    const { sessionToken, xmlAddress } = parameters;
    const user = await Effect.runPromise(verifySessionToken(sessionToken));
    const database = createDatabase(this.env.ethang_rss);
    await addSubscriptionMutation(database, { xmlAddress }, user);
    return createCachedJsonResponse(null, {
      cacheControl: { scope: "no-store" }
    });
  }

  public async allArticles(parameters: {
    after?: string;
    first?: number;
    isRead?: boolean;
    sessionToken: string;
  }) {
    const { sessionToken, ...queryParameters } = parameters;
    const user = await Effect.runPromise(verifySessionToken(sessionToken));

    const database = createDatabase(this.env.ethang_rss);

    const result = await allArticlesQuery(database, queryParameters, user);
    return createCachedJsonResponse(result, {
      cacheControl: { scope: "no-store" },
      vary: ["Cookie"]
    });
  }

  public async feedArticles(parameters: {
    after?: string;
    feedId: string;
    first?: number;
    isRead?: boolean;
    sessionToken: string;
  }) {
    const { sessionToken, ...queryParameters } = parameters;
    const user = await Effect.runPromise(verifySessionToken(sessionToken));

    const database = createDatabase(this.env.ethang_rss);

    const result = await feedArticlesQuery(database, queryParameters, user);
    return createCachedJsonResponse(result, {
      cacheControl: { scope: "no-store" },
      vary: ["Cookie"]
    });
  }

  public override fetch(): Response {
    return new Response("OK", { status: 200 });
  }

  public async markArticleRead(parameters: {
    articleId: string;
    isRead: boolean;
    sessionToken: string;
  }) {
    const { sessionToken, ...queryParameters } = parameters;
    const user = await Effect.runPromise(verifySessionToken(sessionToken));

    const database = createDatabase(this.env.ethang_rss);

    const result = await markArticleReadMutation(
      database,
      queryParameters,
      user
    );
    return createCachedJsonResponse(result, {
      cacheControl: { scope: "no-store" }
    });
  }

  public async removeSubscription(parameters: {
    feedId: string;
    sessionToken: string;
  }) {
    const { sessionToken, ...mutationParameters } = parameters;
    const user = await Effect.runPromise(verifySessionToken(sessionToken));
    const database = createDatabase(this.env.ethang_rss);
    await removeSubscriptionMutation(database, mutationParameters, user);
    return createCachedJsonResponse(null, {
      cacheControl: { scope: "no-store" }
    });
  }

  public override async scheduled(event: ScheduledEvent) {
    const workflowId = `fetch-feeds-${event.scheduledTime}`;
    const workflowBinding = this.env.FETCH_FEEDS_WORKFLOW;

    const startFetchFeedsWorkflow = fn("startFetchFeedsWorkflow")(function* () {
      const tryCreateWorkflow = Effect.tryPromise({
        catch: (error: unknown) => {
          return Error.isError(error) ? error : new Error(String(error));
        },
        try: async () => {
          return workflowBinding.create({ id: workflowId });
        }
      });

      return yield* pipe(
        tryCreateWorkflow,
        Effect.catchAll((error) => {
          const { message } = error;

          if (includes(message, "already exists")) {
            return Effect.void;
          }

          return pipe(
            Effect.logError("Failed to start feed sync workflow", {
              error: message,
              stack: error.stack
            }),
            Effect.flatMap(() => {
              return Effect.fail(error);
            })
          );
        })
      );
    });

    await Effect.runPromise(startFetchFeedsWorkflow());
  }

  public async subscription(parameters: { feedId: string }) {
    const database = createDatabase(this.env.ethang_rss);

    const result = await subscriptionQuery(database, parameters);
    return createCachedJsonResponse(result, {
      cacheControl: { maxAge: 300, scope: "public", swr: 3600 },
      tags: ["subscriptions", `subscription:${parameters.feedId}`]
    });
  }

  public async subscriptions(parameters: {
    after?: string;
    first?: number;
    sessionToken: string;
    sortBy?: {
      direction: "ASC" | "DESC";
      field: "PUBLISHED_AT" | "TITLE";
    };
  }) {
    const { sessionToken, ...queryParameters } = parameters;
    const user = await Effect.runPromise(verifySessionToken(sessionToken));

    const database = createDatabase(this.env.ethang_rss);

    const result = await subscriptionsQuery(database, queryParameters, user);
    return createCachedJsonResponse(result, {
      cacheControl: { scope: "no-store" },
      vary: ["Cookie"]
    });
  }
}

export { FetchFeedsWorkflow } from "./cron/fetch-feeds-workflow.ts";
