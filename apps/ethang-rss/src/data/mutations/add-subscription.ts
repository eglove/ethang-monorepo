import { eq } from "drizzle-orm";
import { Effect } from "effect";
import attempt from "lodash/attempt.js";
import isNil from "lodash/isNil.js";
import trim from "lodash/trim.js";

import type { User } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";
import { extractIconUrl } from "../../util/extract-icon-url.ts";
import { parseFeedMetadata } from "../../util/parse-feed-metadata.ts";

const fetchDerivedMetadata = async (xmlAddress: string) => {
  const derived: { title: string; website: string } = {
    title: "",
    website: ""
  };

  await Effect.runPromise(
    Effect.tryPromise({
      catch: (error: unknown) => {
        // v8 ignore next -- defensive guard: try block only throws inside async fetch branches
        return Error.isError(error) ? error : new Error(String(error));
      },
      try: async () => {
        const response = await globalThis.fetch(xmlAddress);

        if (response.ok) {
          const xmlText = await response.text();
          const parsedMeta = parseFeedMetadata(xmlText);

          if (parsedMeta.title) {
            derived.title = parsedMeta.title;
          }

          if (parsedMeta.website) {
            derived.website = parsedMeta.website;
          }
        }
      }
    }).pipe(Effect.ignoreLogged)
  );

  return derived;
};

const fillMissingFromUrl = (
  derived: { title: string; website: string },
  xmlAddress: string
) => {
  attempt(() => {
    const url = new URL(xmlAddress);

    if ("" === trim(derived.title)) {
      derived.title = url.hostname;
    }

    if ("" === trim(derived.website)) {
      derived.website = url.origin;
    }
  });
};

const fetchIconUrl = async (website: string) => {
  let iconUrl: null | string = null;

  await Effect.runPromise(
    Effect.tryPromise({
      catch: (error: unknown) => {
        // v8 ignore next -- defensive guard: try block only throws inside async fetch branches
        return Error.isError(error) ? error : new Error(String(error));
      },
      try: async () => {
        const websiteResponse = await globalThis.fetch(website);

        if (websiteResponse.ok) {
          const html = await websiteResponse.text();
          const extracted = extractIconUrl(html, website);
          // v8 ignore next -- defensive guard: extractIconUrl returns null for matches; non-null branch requires explicit extractable icon
          if (!isNil(extracted)) {
            iconUrl = extracted;
          }
        }
      }
    }).pipe(Effect.ignoreLogged)
  );

  return iconUrl;
};

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
    const derived = await fetchDerivedMetadata(parameters.xmlAddress);

    if ("" === trim(derived.title) || "" === trim(derived.website)) {
      fillMissingFromUrl(derived, parameters.xmlAddress);
    }

    const hasWebsite = "" !== trim(derived.website);
    const derivedIconUrl: null | string = hasWebsite
      ? await fetchIconUrl(derived.website)
      : null;

    [feed] = await database
      .insert(databaseSchema.feedsTable)
      .values({
        iconUrl: derivedIconUrl,
        title: trim(derived.title),
        website: trim(derived.website),
        xmlAddress: parameters.xmlAddress
      })
      .returning();
  }

  if (isNil(feed)) {
    return Effect.runSync(Effect.die(new Error("Unable to insert feed")));
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
