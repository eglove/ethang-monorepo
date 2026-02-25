import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  apiVersion: "1",
  dataset: "production",
  // eslint-disable-next-line cspell/spellchecker
  projectId: "3rkvshhk",
  useCdn: true,
});
