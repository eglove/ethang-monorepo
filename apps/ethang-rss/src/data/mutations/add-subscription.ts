import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { eq } from "drizzle-orm";
import attempt from "lodash/attempt.js";
import isNil from "lodash/isNil.js";
import trim from "lodash/trim.js";

import type { User } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";
import { parseFeedMetadata } from "../../util/parse-feed-metadata.ts";

export const addSubscriptionMutation = async (
  database: Database,
  parameters: { xmlAddress: string },
  user: User
) => {
  let [feed] = await database
    .select()
    .from(databaseSchema.feedsTable)
    .where(eq(databaseSchema.feedsTable.xmlAddress, parameters.xmlAddress));

  if (isNil(feed)) {
    let derivedTitle = "";
    let derivedWebsite = "";

    await attemptAsync(async () => {
      const response = await globalThis.fetch(parameters.xmlAddress);

      if (response.ok) {
        const xmlText = await response.text();
        const parsedMeta = parseFeedMetadata(xmlText);

        if (parsedMeta.title) {
          derivedTitle = parsedMeta.title;
        }

        if (parsedMeta.website) {
          derivedWebsite = parsedMeta.website;
        }
      }
    });

    if ("" === trim(derivedTitle) || "" === trim(derivedWebsite)) {
      attempt(() => {
        const url = new URL(parameters.xmlAddress);

        if ("" === trim(derivedTitle)) {
          derivedTitle = url.hostname;
        }

        if ("" === trim(derivedWebsite)) {
          derivedWebsite = url.origin;
        }
      });
    }

    [feed] = await database
      .insert(databaseSchema.feedsTable)
      .values({
        title: trim(derivedTitle),
        website: trim(derivedWebsite),
        xmlAddress: parameters.xmlAddress
      })
      .returning();
  }

  if (isNil(feed)) {
    throw new Error("Unable to insert feed");
  }

  await database
    .insert(databaseSchema.subscriptionsTable)
    .values({
      feedId: feed.id,
      userId: user.sub
    })
    .onConflictDoNothing();

  return feed;
};
