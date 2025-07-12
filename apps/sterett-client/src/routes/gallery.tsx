import { Image } from "@heroui/image";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import get from "lodash/get.js";
import map from "lodash/map.js";

import { Container } from "../components/container.tsx";
import { EmptyContent } from "../components/empty-content.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { getGalleryImagesQueryOptions } from "../sanity/queries/get-gallery-images.ts";
import { getRouteQueries } from "../utilities/get-route-queries.ts";
import { setMeta } from "../utilities/set-meta.ts";

export const galleryRouteQueries = {
  images: getGalleryImagesQueryOptions(),
};

const RouteComponent = () => {
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

export const Route = createFileRoute("/gallery")({
  beforeLoad() {
    setMeta({
      description: "Pictures from Sterett Creek Village Trustee",
      title: "Sterett Creek Village Trustee | Gallery",
    });
  },
  component: RouteComponent,
  errorComponent: EmptyContent,
  async loader() {
    // @ts-expect-error it's fine
    return getRouteQueries(galleryRouteQueries);
  },
});
