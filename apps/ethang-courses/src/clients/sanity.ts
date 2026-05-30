import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  apiVersion: "1",
  dataset: "production",
  projectId: "3rkvshhk",
  useCdn: true
});
