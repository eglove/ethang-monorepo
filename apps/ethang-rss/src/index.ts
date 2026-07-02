import { LoggerClient } from "@ethang/logger-sdk";
import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { Effect, pipe } from "effect";
import includes from "lodash/includes.js";
import isError from "lodash/isError.js";
import convertToString from "lodash/toString.js";

import { addSubscriptionMutation } from "./data/mutations/add-subscription.ts";
import { markArticleReadMutation } from "./data/mutations/mark-article-read.ts";
import { allArticlesQuery } from "./data/queries/all-articles.ts";
import { feedArticlesQuery } from "./data/queries/feed-articles.ts";
import { subscriptionQuery } from "./data/queries/subscription.ts";
import { subscriptionsQuery } from "./data/queries/subscriptions.ts";
// eslint-disable-next-line sonar/no-wildcard-import
import * as databaseSchema from "./db/schema.ts";
import {
  getEnvironmentString,
  getSecretValue
} from "./util/get-environment-secret.ts";

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

const verifySessionToken = async (sessionToken: string): Promise<User> => {
  const userResponse = await globalThis.fetch(
    "https://auth.ethang.dev/verify",
    {
      headers: { "X-Token": sessionToken }
    }
  );

  if (!userResponse.ok) {
    throw new Error("Unauthorized");
  }

  return userResponse.json();
};

// eslint-disable-next-line unicorn/no-anonymous-default-export
export default class extends WorkerEntrypoint<Env> {
  public async addSubscription(parameters: {
    sessionToken: string;
    xmlAddress: string;
  }) {
    const { sessionToken, xmlAddress } = parameters;
    const user = await verifySessionToken(sessionToken);
    const database = createDatabase(this.env.ethang_rss);
    return addSubscriptionMutation(database, { xmlAddress }, user);
  }

  public async allArticles(parameters: {
    after?: string;
    first?: number;
    isRead?: boolean;
    sessionToken: string;
  }) {
    const { sessionToken, ...queryParameters } = parameters;
    const user = await verifySessionToken(sessionToken);

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
    const user = await verifySessionToken(sessionToken);

    const database = createDatabase(this.env.ethang_rss);

    return feedArticlesQuery(database, queryParameters, user);
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
    const user = await verifySessionToken(sessionToken);

    const database = createDatabase(this.env.ethang_rss);

    return markArticleReadMutation(database, queryParameters, user);
  }

  public override async scheduled(event: ScheduledEvent) {
    const workflowId = `fetch-feeds-${event.scheduledTime}`;

    const feedWorkflow = Effect.tryPromise({
      catch: (error) => {
        return error;
      },
      try: async () => {
        return this.env.FETCH_FEEDS_WORKFLOW.create({ id: workflowId });
      }
    });

    const apiKeyEffect = pipe(
      getSecretValue(this.env.LOGGER_API_KEY),
      // eslint-disable-next-line lodash/prefer-lodash-method
      Effect.map(convertToString)
    );

    const runnableEffect = pipe(
      feedWorkflow,
      Effect.catchAll((error) => {
        const message = isError(error) ? error.message : convertToString(error);

        if (includes(message, "already exists")) {
          return Effect.void;
        }

        return pipe(
          apiKeyEffect,
          // eslint-disable-next-line lodash/prefer-lodash-method,array-callback-return
          Effect.map((apiKey) => {
            const environmentName =
              getEnvironmentString(this.env, "ENVIRONMENT") ?? "production";

            const logger = new LoggerClient({
              apiKey,
              environment: environmentName,
              serviceName: "ethang-rss-scheduler"
            });

            logger.error(
              "Failed to start feed sync workflow",
              undefined,
              isError(error) ? error.stack : convertToString(error)
            );
          }),
          Effect.flatMap(() => {
            return Effect.fail(error);
          })
        );
      })
    );

    await Effect.runPromise(runnableEffect);
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
    const user = await verifySessionToken(sessionToken);

    const database = createDatabase(this.env.ethang_rss);

    return subscriptionsQuery(database, queryParameters, user);
  }
}

export { FetchFeedsWorkflow } from "./cron/fetch-feeds-workflow.ts";
