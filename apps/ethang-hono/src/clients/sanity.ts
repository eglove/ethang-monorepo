import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  apiVersion: "1",
  dataset: "production",
  // cspell:disable-next-line
  projectId: "3rkvshhk",
  useCdn: true,
});
