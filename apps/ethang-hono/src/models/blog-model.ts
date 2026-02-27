import { sanityClient } from "../clients/sanity.ts";

export type BlogModelType = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _system: {
    base: {
      id: string;
      rev: string;
    };
  };
  _type: string;
  _updatedAt: string;
  author: string;
  blogCategory: {
    _ref: string;
    _type: string;
  };
  body: {
    _key: string;
    _type: string;
    alt?: string;
    asset?: {
      _ref: string;
      _type: string;
    };
    author?: string;
    children?: {
      _key: string;
      _type: string;
      marks: string[];
      text: string;
    }[];
    markDefs?: {
      _key: string;
      _type: string;
      href: string;
    }[];
    quote?: string;
    source?: string;
    sourceUrl?: string;
    style?: string;
    url?: string;
  }[];
  description: string;
  featuredImage: {
    alt: string;
    url: string;
  };
  publishedAt: string;
  slug: {
    _type: string;
    current: string;
  };
  title: string;
};

export class BlogModel {
  public async getBlogBySlug(slug: string) {
    return sanityClient.fetch<BlogModelType>(
      `*[_type == "blog" && slug.current == $slug][0]{
        ...,
        "featuredImage": {
          "alt": featuredImage.alt,
          "url": featuredImage.asset->url
        },
        "body": body[]{
          ...,
          _type == "image" => {
            ...,
            "url": asset->url
          }
        }
      }`,
      { slug },
    );
  }
}
