import { Image } from "@nextui-org/image";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
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
          return (
            <Image
              alt={image.description}
              className="relative h-auto max-w-full rounded-lg"
              height={Number(image.image.asset.metadata.dimensions.height)}
              key={image.image.asset.url}
              src={image.image.asset.url}
              width={Number(image.image.asset.metadata.dimensions.width)}
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
    return getRouteQueries(galleryRouteQueries);
  },
  path: "/gallery",
});
