import type { BlogModelType } from "./blog-model-type.ts";

import { sanityClient } from "../clients/sanity.ts";

export class BlogModel {
  public async getBlogBySlug(slug: string) {
    return sanityClient.fetch<BlogModelType>(
      `*[_type == "blog" && slug.current == $slug][0]{
        ...,
        "featuredImage": {
          "alt": featuredImage.alt,
          "asset": featuredImage.asset->{...}
        },
        "body": body[]{
          ...,
          _type == "image" => {
            ...,
            "asset": asset->{...}
          },
          _type == "videoEmbed" => {
            ...,
            "url": url
          },
          _type == "blockquote" || _type == "quote" => {
            ...,
            "quote": quote
          }
        }
      }`,
      { slug },
    );
  }
}
