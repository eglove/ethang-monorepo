import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "../../clients/react-query/query-keys.ts";
import {
  NO_DRAFTS,
  sterettSanityClient,
} from "../../clients/sanity/sanity-client.ts";

export type ImageAsset = {
  metadata: {
    dimensions: {
      height: number;
      width: number;
    };
  };
  url: string;
};

type GetGalleryImagesCountReturn = {
  _id: string;
  description: string;
  image: {
    asset: ImageAsset;
  };
}[];

export const getGalleryImagesCount = async () => {
  const imagesQuery = `*[_type == "galleryImage" && ${NO_DRAFTS}]{_id, description, image{asset->{_id, url, path, assetId, extension, metadata{dimensions{height, width}}}}}`;

  const images =
    await sterettSanityClient.fetch<GetGalleryImagesCountReturn>(imagesQuery);

  return images.length;
};

export const getGalleryImagesCountQueryOptions = () => {
  return queryOptions({
    queryFn: getGalleryImagesCount,
    queryKey: [queryKeys.sterett, queryKeys.galleryImagesCount],
  });
};
