import type { toHTML } from "@portabletext/to-html";

import { sterettSanityClient } from "../clients/sanity-client.ts";

type GetPageReturn = {
  _id: string;
  _updatedAt: string;
  content: Parameters<typeof toHTML>[0];
  title: string;
}[];

export const getPage = async (slug: string) => {
  const pageQuery = `*[_type == "page" && slug.current == $slug]{
    _id,
    _updatedAt,
    title,
    content[] {
      ...,
      asset-> {
        _id,
        url,
        hotspot,
        crop,
        metadata {
          lqip,
          dimensions {
            height,
            width,
          }
        }
      }
    }
  }`;

  const pages = await sterettSanityClient.fetch<GetPageReturn>(pageQuery, {
    slug,
  });

  return pages[0];
};
