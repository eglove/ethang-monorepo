import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import {
  type StructureBuilder,
  type StructureContext,
  structureTool,
} from "sanity/structure";

import { schemaTypes } from "./schema-types";

export default defineConfig({
  dataset: "production",
  name: "default",

  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    structureTool({
      structure: (S: StructureBuilder, context: StructureContext) => {
        return S.list()
          .title("PathList")
          .items([
            ...S.documentTypeListItems(),
            orderableDocumentListDeskItem({
              context,
              S,
              title: "Learning Paths",
              type: "learningPath",
            }),
          ]);
      },
    }),
    visionTool(),
  ],
  // eslint-disable-next-line cspell/spellchecker
  projectId: "3rkvshhk",
  schema: {
    types: schemaTypes,
  },
  title: "ethang-admin",
});
