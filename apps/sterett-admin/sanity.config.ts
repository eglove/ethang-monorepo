import { defineConfig } from "sanity";

import {
  developmentPlugins,
  productionPlugins,
} from "./sanity-config-utilities.ts";
import schema from "./schemas/schema.ts";

export default defineConfig({
  dataset: "production",
  name: "default",
  plugins:
    // @ts-expect-error it's fine
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
