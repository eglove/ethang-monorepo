import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./schemaTypes";

export default defineConfig({
  dataset: "production",
  name: "default",
  plugins: [structureTool(), visionTool()],
  // eslint-disable-next-line cspell/spellchecker
  projectId: "j1gcump7",
  schema: {
    types: schemaTypes,
  },
  title: "ethang",
});
