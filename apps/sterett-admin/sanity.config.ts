import { defineConfig } from "sanity";

import schema from "./schemas/schema.ts";
import { developmentPlugins, productionPlugins } from "./util-sanity-config.ts";

export default defineConfig({
  dataset: "production",
  name: "default",
  plugins:
    // @ts-expect-error it's fine
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    "development" === import.meta.env.NODE_ENV
      ? developmentPlugins
      : productionPlugins,
  // eslint-disable-next-line cspell/spellchecker
  projectId: "540gjnt8",
  schema: {
    types: schema,
  },
  title: "Sterett Creek Village Trustee Admin",
});
