import { Schema } from "effect";

export type NewsSchemaType = Schema.Schema.Type<NewsSchema>;

export class NewsSchema extends Schema.Class<NewsSchema>("NewsSchema")({
  href: Schema.String,
  id: Schema.String,
  published: Schema.String,
  quote: Schema.optional(Schema.NullOr(Schema.String)),
  title: Schema.String,
  youtubeVideoId: Schema.optional(Schema.String)
}) {}
