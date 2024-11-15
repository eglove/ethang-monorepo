import { queryOptions } from "@tanstack/react-query";
import shuffle from "lodash/shuffle.js";

import type { ImageAsset } from "../../types/sanity/image-asset.ts";

import { queryKeys } from "../../clients/react-query/query-keys.ts";
import {
  NO_DRAFTS,
  sterettSanityClient,
} from "../../clients/sanity/sanity-client.ts";

export type GetGalleryImagesReturn = {
  _id: string;
  description: string;
  image: {
    asset: ImageAsset;
  };
}[];

export const getGalleryImages = async () => {
  const imagesQuery = `*[_type == "galleryImage" && ${NO_DRAFTS}]{_id, description, image{asset->{_id, url, path, assetId, extension, metadata{dimensions{height, width}}}}}`;

  const images =
    await sterettSanityClient.fetch<GetGalleryImagesReturn>(imagesQuery);

  return shuffle(images);
};

export const getGalleryImagesQueryOptions = () => {
  return queryOptions({
    queryFn: getGalleryImages,
    queryKey: [queryKeys.sterett, queryKeys.getGalleryImages],
  });
};
