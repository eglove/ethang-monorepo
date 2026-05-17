import map from "lodash/map.js";

export type Connection<T> = {
  edges: {
    cursor: string;
    node: T;
  }[];
  pageInfo: {
    endCursor: null | string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: null | string;
  };
};

export const createConnection = <T extends { id: string }>(
  items: T[],
  hasNextPage: boolean
): Connection<T> => {
  const edges = map(items, (item) => {
    return {
      cursor: item.id,
      node: item
    };
  });

  return {
    edges,
    pageInfo: {
      endCursor: edges.at(-1)?.cursor ?? null,
      hasNextPage,
      hasPreviousPage: false, // Simple forward-only pagination for now
      startCursor: edges.at(0)?.cursor ?? null
    }
  };
};
