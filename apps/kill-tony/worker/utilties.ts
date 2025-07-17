import type { GraphQLResolveInfo } from "graphql/type";

import forEach from "lodash/forEach";
import get from "lodash/get";
import set from "lodash/set";

export const getPrismaSelect = (info: GraphQLResolveInfo) => {
  const selections = get(info, ["fieldNodes", 0, "selectionSet", "selections"]);

  const selectionObject: Record<string, boolean> = {};
  // eslint-disable-next-line lodash/prefer-filter
  forEach(
    selections,
    // @ts-expect-error wrong type
    (selection: { name: { value: string } }) => {
      if ("__typename" !== selection.name.value) {
        set(selectionObject, selection.name.value, true);
      }
    },
  );

  return selectionObject;
};
