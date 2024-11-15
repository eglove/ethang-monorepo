import type {
  StructureResolver,
} from "sanity/structure";

import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";

export const deskStructure: StructureResolver = (
  S,
  context,
) => {
  return S.list()
    .title("Content")
    .items([
      ...S.documentTypeListItems(),
      orderableDocumentListDeskItem({
        context,
        S,
        title: "Trustees Order",
        type: "trustee",
      }),
      orderableDocumentListDeskItem({
        context,
        S,
        title: "Navigation Order",
        type: "navigation",
      }),
    ]);
};
