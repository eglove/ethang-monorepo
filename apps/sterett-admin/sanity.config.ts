import get from "lodash/get.js";
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
    "development" === get(import.meta, ["env", "NODE_ENV"])
      ? developmentPlugins
      : productionPlugins,
  // eslint-disable-next-line cspell/spellchecker
  projectId: "540gjnt8",
  schema: {
    types: schema,
  },
  title: "Sterett Creek Village Trustee Admin",
});
