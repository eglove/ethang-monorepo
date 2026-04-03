import type { GetBlogBySlug } from "./get-blog-by-slug.ts";
import type { Blog, GetBlogs, PaginatedBlogResult } from "./get-blogs.ts";

import { sanityClient } from "../clients/sanity.ts";

export class BlogModel {
  private readonly blogSchema = `{
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
  }`;

  public async getAllBlogs() {
    return sanityClient.fetch<GetBlogs>(`*[_type == "blog"] | order(_createdAt desc) {
      _id,
      title,
      author,
      _updatedAt,
      slug,
      description,
      featuredImage->{...},
      blogCategory->{...},
      _createdAt,
    }`);
  }

  public async getBlogBySlug(slug: string) {
    return sanityClient.fetch<GetBlogBySlug>(
      `*[_type == "blog" && slug.current == $slug][0]${this.blogSchema}`,
      { slug },
    );
  }

  public async getPaginatedBlogs(
    page: number,
    pageSize: number,
  ): Promise<PaginatedBlogResult> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const result = await sanityClient.fetch<
      [{ posts: Blog[] }, { total: number }]
    >(
      `[
      { "posts": *[_type == "blog"] | order(_createdAt desc)[$start...$end] {
        _id,
        title,
        author,
        _updatedAt,
        slug,
        description,
        featuredImage->{...},
        blogCategory->{...},
        _createdAt,
      } },
      { "total": count(*[_type == "blog"]) }
    ]`,
      { end, start },
    );

    const [{ posts }, { total }] = result;
    const maxPages = Math.ceil(total / pageSize) || 1;

    return { maxPages, posts, total };
  }
}
