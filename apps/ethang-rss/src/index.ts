import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { Effect, pipe, Schema } from "effect";
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

export type User = {
  email: string;
  exp: number;
  iat: number;
  sub: string;
  username: string;
};

const UserSchema = Schema.Struct({
  email: Schema.String,
  exp: Schema.Number,
  iat: Schema.Number,
  sub: Schema.String,
  username: Schema.String
});

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
      try: async () => {
        return Schema.decodeUnknownPromise(UserSchema)(
          await userResponse.json()
        );
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
    return null;
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

    return allArticlesQuery(database, queryParameters, user);
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

    return feedArticlesQuery(database, queryParameters, user);
  }

  public override fetch(_request: Request) {
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

    return markArticleReadMutation(database, queryParameters, user);
  }

  public async removeSubscription(parameters: {
    feedId: string;
    sessionToken: string;
  }) {
    const { sessionToken, ...mutationParameters } = parameters;
    const user = await Effect.runPromise(verifySessionToken(sessionToken));
    const database = createDatabase(this.env.ethang_rss);
    await removeSubscriptionMutation(database, mutationParameters, user);
    return null;
  }

  public override async scheduled(event: ScheduledEvent) {
    const workflowId = `fetch-feeds-${event.scheduledTime}`;
    const workflowBinding = this.env.FETCH_FEEDS_WORKFLOW;

    const startFetchFeedsWorkflow = Effect.fn("startFetchFeedsWorkflow")(
      function* () {
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
      }
    );

    await Effect.runPromise(startFetchFeedsWorkflow());
  }

  public async subscription(parameters: { feedId: string }) {
    const database = createDatabase(this.env.ethang_rss);

    return subscriptionQuery(database, parameters);
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

    return subscriptionsQuery(database, queryParameters, user);
  }
}

export { FetchFeedsWorkflow } from "./cron/fetch-feeds-workflow.ts";
