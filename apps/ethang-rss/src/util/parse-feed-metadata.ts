import { Effect, Option, Schema } from "effect";
import { XMLParser } from "fast-xml-parser";
import find from "lodash/find.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import trim from "lodash/trim.js";

type DecodedFeedMetadata = Schema.Schema.Type<typeof FeedMetadataSchema>;
type FeedLink = FeedLinkEntry | readonly FeedLinkEntry[];

type FeedLinkEntry = LinkObject | string;
type LinkObject = {
  "@_href"?: string;
  "@_rel"?: string;
  "#text"?: string;
};

type TextOrTextObject = { "#text"?: string } | string;

const AnyObjectSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown
});

const TextOrTextObjectSchema = Schema.Union(Schema.String, AnyObjectSchema);

const LinkEntrySchema = Schema.Union(Schema.String, AnyObjectSchema);

const FeedLinkSchema = Schema.Union(
  Schema.String,
  AnyObjectSchema,
  Schema.Array(LinkEntrySchema)
);

const AtomFeedSchema = Schema.Struct({
  link: Schema.optional(FeedLinkSchema),
  title: Schema.optional(TextOrTextObjectSchema)
});

const RssChannelSchema = Schema.Struct({
  link: Schema.optional(TextOrTextObjectSchema),
  title: Schema.optional(TextOrTextObjectSchema)
});

const RssFeedSchema = Schema.Struct({
  channel: Schema.optional(RssChannelSchema)
});

const FeedMetadataSchema = Schema.Struct({
  feed: Schema.optional(AtomFeedSchema),
  rss: Schema.optional(RssFeedSchema)
});

const extractText = (value: null | TextOrTextObject) => {
  if (isString(value)) {
    return value;
  }
  return value?.["#text"] ?? "";
};

const isLinkObject = (entry: FeedLinkEntry): entry is LinkObject => {
  return !isString(entry);
};

const isLinkArray = (value: FeedLink): value is readonly FeedLinkEntry[] => {
  return isArray(value);
};

const findAlternate = (links: readonly FeedLinkEntry[]) => {
  return (
    find(links, (entry) => {
      return isLinkObject(entry) && "alternate" === entry["@_rel"];
    }) ?? null
  );
};

const findNonSelf = (links: readonly FeedLinkEntry[]) => {
  return (
    find(links, (entry) => {
      return (
        isLinkObject(entry) &&
        (isNil(entry["@_rel"]) || "self" !== entry["@_rel"])
      );
    }) ?? null
  );
};

const linkHref = (entry: FeedLinkEntry | null) => {
  if (isString(entry)) {
    return entry;
  }
  return entry?.["@_href"] ?? "";
};

const objectHrefOrText = (entry: LinkObject) => {
  return (
    entry["@_href"] ??

    entry["#text"] ??
    ""
  );
};

const chooseArrayLink = (links: readonly FeedLinkEntry[]) => {

  const chosen: FeedLinkEntry | null =
    findAlternate(links) ?? findNonSelf(links) ?? links[0] ?? null;
  return linkHref(chosen);
};

const extractAtomWebsite = (link: FeedLink | null) => {
  if (isNil(link)) {
    return "";
  }
  if (isString(link)) {
    return link;
  }
  if (isLinkArray(link)) {
    return chooseArrayLink(link);
  }
  return objectHrefOrText(link);
};

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false
});

export const parseFeedMetadata = (xmlText: string) => {
  const decoded = Effect.runSync(
    Effect.try({
      catch: (error: unknown) => {

        return Error.isError(error) ? error : new Error(String(error));
      },
      try: () => {
        return Schema.decodeUnknownOption(FeedMetadataSchema)(
          parser.parse(xmlText)
        );
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(Option.none<DecodedFeedMetadata>());
      })
    )
  );

  const metadata: DecodedFeedMetadata = Option.isSome(decoded)
    ? decoded.value
    : {};

  let title = "";
  let website = "";

  if (isNil(metadata.rss?.channel)) {
    if (!isNil(metadata.feed)) {
      title = extractText(metadata.feed.title ?? null);
      website = extractAtomWebsite(metadata.feed.link ?? null);
    }
  } else {
    title = extractText(metadata.rss.channel.title ?? null);
    website = extractText(metadata.rss.channel.link ?? null);
  }

  return {
    title: trim(title),
    website: trim(website)
  };
};
