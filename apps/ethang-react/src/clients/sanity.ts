import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

export const sanityClient = createClient({
  apiVersion: "1",
  dataset: "production",
  // cspell:disable-next-line
  projectId: "3rkvshhk",
  useCdn: true
});

export const sanityImage = createImageUrlBuilder(sanityClient);
