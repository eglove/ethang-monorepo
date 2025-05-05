import { Image } from "@heroui/image";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import get from "lodash/get.js";
import map from "lodash/map";

import { Container } from "../components/container.tsx";
import { EmptyContent } from "../components/empty-content.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { rootRoute } from "../router/router.ts";
import { getGalleryImagesQueryOptions } from "../sanity/queries/get-gallery-images.ts";
import { getRouteQueries } from "../util/get-route-queries.ts";
import { setMeta } from "../util/set-meta.ts";

export const galleryRouteQueries = {
  images: getGalleryImagesQueryOptions(),
};

export const GalleryRoute = () => {
  const { data } = useSuspenseQuery(galleryRouteQueries.images);

  return (
    <MainLayout>
      <Container styleNames="flex flex-wrap gap-4">
        {map(data, (image) => {
          const dimensions = get(image, [
            "image",
            "asset",
            "metadata",
            "dimensions",
          ]);
          const url = get(image, ["image", "asset", "url"]);

          return (
            <Image
              alt={image.description}
              className="relative h-auto max-w-full rounded-lg"
              height={dimensions.height}
              key={url}
              src={url}
              width={dimensions.width}
            />
          );
        })}
      </Container>
    </MainLayout>
  );
};

export const galleryRoute = createRoute({
  beforeLoad() {
    setMeta({
      description: "Pictures from Sterett Creek Village Trustee",
      title: "Sterett Creek Village Trustee | Gallery",
    });
  },
  component: GalleryRoute,
  errorComponent: EmptyContent,
  getParentRoute() {
    return rootRoute;
  },
  async loader() {
    // @ts-expect-error it's fine
    return getRouteQueries(galleryRouteQueries);
  },
  path: "/gallery",
});
