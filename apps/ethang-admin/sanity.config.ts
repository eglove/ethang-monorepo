import { codeInput } from "@sanity/code-input";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import {
  type StructureBuilder,
  type StructureResolverContext,
  structureTool,
} from "sanity/structure";

import { schemaTypes } from "./schema-types/index.ts";

export default defineConfig({
  dataset: "production",
  name: "default",

  plugins: [
    structureTool({
      structure: (S: StructureBuilder, context: StructureResolverContext) => {
        return S.list()
          .title("PathList")
          .items([
            orderableDocumentListDeskItem({
              context,
              S,
              title: "Learning Paths",
              type: "learningPath",
            }),
            ...S.documentTypeListItems(),
            orderableDocumentListDeskItem({
              context,
              S,
              title: "WoW Tasks",
              type: "wowTask",
            }),
          ]);
      },
    }),
    visionTool(),
    codeInput(),
  ],
  // eslint-disable-next-line cspell/spellchecker
  projectId: "3rkvshhk",
  schema: {
    types: schemaTypes,
  },
  title: "ethang-admin",
});
