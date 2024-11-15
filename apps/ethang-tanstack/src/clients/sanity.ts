import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const NO_DRAFTS = "!(_id in path('drafts.**'))";

export const sanityClient = createClient({
  apiVersion: "1",
  dataset: "production",
  // eslint-disable-next-line cspell/spellchecker
  projectId: "j1gcump7",
  useCdn: true,
});

export const sanityImage = imageUrlBuilder(sanityClient);
