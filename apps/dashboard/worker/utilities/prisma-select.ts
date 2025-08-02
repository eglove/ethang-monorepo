import type { SelectionNode } from "graphql/language";
import type { GraphQLResolveInfo } from "graphql/type";

import find from "lodash/find";
import forEach from "lodash/forEach";
import get from "lodash/get";
import isString from "lodash/isString";

export const prismaSelect = (
  info: GraphQLResolveInfo,
  selections?: SelectionNode[],
) => {
  const _selections =
    selections ?? get(info, ["fieldNodes", 0, "selectionSet", "selections"]);
  const selectObject: Record<string, true> = {};

  forEach(_selections, (selection) => {
    const value = get(selection, ["name", "value"]) as unknown;

    if (isString(value) && "__typename" !== value) {
      selectObject[value] = true;
    }
  });

  return selectObject;
};

export const prismaSelectWithPagination = (
  info: GraphQLResolveInfo,
  modelKey: string,
) => {
  const selections = get(info, ["fieldNodes", 0, "selectionSet", "selections"]);
  const resultSelections = find(selections, (selection) => {
    return modelKey === get(selection, ["name", "value"]);
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const resolved = get(resultSelections, [
    "selectionSet",
    "selections",
  ]) as unknown as SelectionNode[] | undefined;

  return prismaSelect(info, resolved);
};
