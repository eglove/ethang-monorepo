import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

export const NO_DRAFTS = "!(_id in path('drafts.**'))";

export const sterettSanityClient = createClient({
  apiVersion: "1",
  dataset: "production",
  // eslint-disable-next-line cspell/spellchecker
  projectId: "540gjnt8",
  useCdn: true,
});

export const sanityImage = createImageUrlBuilder(sterettSanityClient);
